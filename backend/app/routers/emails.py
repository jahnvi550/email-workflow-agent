import random
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.email import EmailMessage
from backend.app.schemas.email_schemas import EmailCreate, EmailRead, EmailUpdate, EmailSimulateRequest, EmailRawImportRequest
from backend.app.services.email_service import EmailService
from backend.app.services.workflow_service import WorkflowService
from backend.app.services.real_email_service import RealEmailService
from backend.app.services.simulator_service import SimulatorService, SIMULATION_PRESETS

router = APIRouter(prefix="/emails", tags=["Emails"])


@router.post("/import-raw")
def import_raw_email(request: EmailRawImportRequest, db: Session = Depends(get_db)):
    """Parses raw text, .EML content, or composed email and triggers automated AI pipeline."""
    return RealEmailService.parse_and_ingest_raw_email(
        db=db,
        raw_text=request.raw_content,
        sender=request.sender,
        subject=request.subject,
        recipient=request.recipient,
        auto_process=request.auto_process
    )



@router.get("", response_model=List[EmailRead])
def list_emails(
    category: Optional[str] = None,
    priority: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(50, le=100),
    offset: int = 0,
    db: Session = Depends(get_db)
):
    emails = EmailService.list_emails(db, category, priority, status, search, limit, offset)
    result = []
    for e in emails:
        result.append(EmailRead(
            id=e.id,
            sender=e.sender,
            recipient=e.recipient,
            subject=e.subject,
            body=e.body,
            received_at=e.received_at,
            status=e.status,
            priority=e.priority,
            category=e.category,
            is_starred=e.is_starred,
            is_archived=e.is_archived,
            thread_id=e.thread_id,
            tasks_count=len(e.tasks),
            workflows_count=len(e.workflows),
            calendar_events_count=len(e.calendar_events)
        ))
    return result


@router.get("/presets")
def get_simulation_presets():
    return SimulatorService.get_presets()


@router.post("/simulate")
def simulate_incoming_email(request: EmailSimulateRequest, db: Session = Depends(get_db)):
    res = EmailService.simulate_email(db, request)
    email = res["email"]
    workflow = res["workflow_run"]
    return {
        "success": True,
        "message": f"Simulated email '{email.subject}' ingested successfully.",
        "email_id": email.id,
        "workflow_id": workflow.id if workflow else None,
        "workflow_state": workflow.state if workflow else "SKIPPED"
    }


@router.post("/auto-triage-all")
def auto_triage_all_unprocessed(db: Session = Depends(get_db)):
    """Automatically finds all UNPROCESSED emails and runs the LangGraph agent on each."""
    unprocessed = db.query(EmailMessage).filter(EmailMessage.status == "UNPROCESSED").all()
    processed_count = 0
    workflow_ids = []

    for email in unprocessed:
        try:
            wf = WorkflowService.start_workflow(db, email.id)
            workflow_ids.append(wf.id)
            processed_count += 1
        except Exception as e:
            print(f"[Auto-Triage] Error processing email {email.id}: {e}")

    return {
        "success": True,
        "message": f"Auto-triaged {processed_count} unprocessed emails with LangGraph.",
        "processed_count": processed_count,
        "workflow_ids": workflow_ids
    }


@router.post("/auto-ingest-random")
def auto_ingest_random_email(db: Session = Depends(get_db)):
    """Ingests a random preset email and immediately executes the full LangGraph pipeline automatically."""
    preset = random.choice(SIMULATION_PRESETS)
    req = EmailSimulateRequest(preset_id=preset["id"], auto_process=True)
    res = EmailService.simulate_email(db, req)
    email = res["email"]
    wf = res["workflow_run"]
    return {
        "success": True,
        "message": f"Auto-streamed and processed email '{email.subject}'",
        "email_id": email.id,
        "subject": email.subject,
        "sender": email.sender,
        "workflow_id": wf.id if wf else None,
        "workflow_state": wf.state if wf else "COMPLETED"
    }


@router.post("", response_model=EmailRead, status_code=status.HTTP_201_CREATED)
def create_email(email_in: EmailCreate, db: Session = Depends(get_db)):
    email = EmailService.create_email(db, email_in)
    return EmailRead(
        id=email.id,
        sender=email.sender,
        recipient=email.recipient,
        subject=email.subject,
        body=email.body,
        received_at=email.received_at,
        status=email.status,
        priority=email.priority,
        category=email.category,
        is_starred=email.is_starred,
        is_archived=email.is_archived,
        thread_id=email.thread_id,
        tasks_count=0,
        workflows_count=0,
        calendar_events_count=0
    )


@router.get("/{id}", response_model=EmailRead)
def get_email(id: str, db: Session = Depends(get_db)):
    email = EmailService.get_email_by_id(db, id)
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    return EmailRead(
        id=email.id,
        sender=email.sender,
        recipient=email.recipient,
        subject=email.subject,
        body=email.body,
        received_at=email.received_at,
        status=email.status,
        priority=email.priority,
        category=email.category,
        is_starred=email.is_starred,
        is_archived=email.is_archived,
        thread_id=email.thread_id,
        tasks_count=len(email.tasks),
        workflows_count=len(email.workflows),
        calendar_events_count=len(email.calendar_events)
    )


@router.post("/{id}/process")
def process_email_workflow(id: str, force_restart: bool = Query(False), db: Session = Depends(get_db)):
    email = EmailService.get_email_by_id(db, id)
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    try:
        wf = WorkflowService.start_workflow(db, id, force_restart=force_restart)
        return {
            "success": True,
            "message": "Workflow generated and processed via LangGraph.",
            "workflow_id": wf.id,
            "workflow_state": wf.state,
            "is_hitl_pending": wf.is_hitl_pending
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@router.patch("/{id}")
def update_email_flags(id: str, update_in: EmailUpdate, db: Session = Depends(get_db)):
    email = EmailService.update_email_flags(db, id, update_in.is_starred, update_in.is_archived)
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    return {"success": True, "message": "Email updated"}


@router.delete("/{id}")
def delete_email(id: str, db: Session = Depends(get_db)):
    deleted = EmailService.delete_email(db, id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Email not found")
    return {"success": True, "message": "Email deleted"}
