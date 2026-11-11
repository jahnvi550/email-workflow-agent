from typing import List, Optional
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, Query, status
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.workflow import WorkflowRun, WorkflowStep
from backend.app.schemas.workflow_schemas import (
    WorkflowRunRead, 
    WorkflowStepRead, 
    HITLApprovalRequest, 
    WorkflowTriggerRequest,
    RefineDraftRequest,
    RefineDraftResponse
)
from backend.app.services.workflow_service import WorkflowService
from backend.app.agent.llm_factory import refine_draft_with_llm


router = APIRouter(prefix="/workflows", tags=["Workflows"])


@router.get("", response_model=List[WorkflowRunRead])
def list_workflows(
    state: Optional[str] = None,
    limit: int = Query(50, le=100),
    offset: int = 0,
    db: Session = Depends(get_db)
):
    workflows = WorkflowService.list_workflows(db, state, limit, offset)
    results = []
    for w in workflows:
        steps_read = [
            WorkflowStepRead(
                id=s.id,
                workflow_id=s.workflow_id,
                node_name=s.node_name,
                status=s.status,
                input_state=s.input_state,
                output_state=s.output_state,
                duration_ms=s.duration_ms,
                created_at=s.created_at
            ) for s in w.steps
        ]
        results.append(WorkflowRunRead(
            id=w.id,
            email_id=w.email_id,
            state=w.state,
            current_node=w.current_node,
            is_hitl_pending=w.is_hitl_pending,
            intent_category=w.intent_category,
            priority=w.priority,
            confidence_score=w.confidence_score,
            risk_level=w.risk_level,
            extracted_plan=w.extracted_plan,
            draft_reply=w.draft_reply,
            proposed_meeting=w.proposed_meeting,
            human_modifications=w.human_modifications,
            execution_logs=w.execution_logs,
            error_message=w.error_message,
            created_at=w.created_at,
            updated_at=w.updated_at,
            steps=steps_read,
            email_subject=w.email.subject if w.email else None,
            email_sender=w.email.sender if w.email else None
        ))
    return results


@router.get("/{id}", response_model=WorkflowRunRead)
def get_workflow(id: str, db: Session = Depends(get_db)):
    w = WorkflowService.get_workflow_by_id(db, id)
    if not w:
        raise HTTPException(status_code=404, detail="Workflow run not found")
    
    steps_read = [
        WorkflowStepRead(
            id=s.id,
            workflow_id=s.workflow_id,
            node_name=s.node_name,
            status=s.status,
            input_state=s.input_state,
            output_state=s.output_state,
            duration_ms=s.duration_ms,
            created_at=s.created_at
        ) for s in w.steps
    ]
    
    return WorkflowRunRead(
        id=w.id,
        email_id=w.email_id,
        state=w.state,
        current_node=w.current_node,
        is_hitl_pending=w.is_hitl_pending,
        intent_category=w.intent_category,
        priority=w.priority,
        confidence_score=w.confidence_score,
        risk_level=w.risk_level,
        extracted_plan=w.extracted_plan,
        draft_reply=w.draft_reply,
        proposed_meeting=w.proposed_meeting,
        human_modifications=w.human_modifications,
        execution_logs=w.execution_logs,
        error_message=w.error_message,
        created_at=w.created_at,
        updated_at=w.updated_at,
        steps=steps_read,
        email_subject=w.email.subject if w.email else None,
        email_sender=w.email.sender if w.email else None
    )


@router.post("/{id}/approve", response_model=WorkflowRunRead)
def approve_hitl_workflow(id: str, approval_in: HITLApprovalRequest, db: Session = Depends(get_db)):
    try:
        modifications = {}
        if approval_in.modified_draft_reply:
            modifications["draft_reply"] = approval_in.modified_draft_reply
        if approval_in.modified_meeting:
            modifications["meeting"] = approval_in.modified_meeting
        if approval_in.modified_tasks:
            modifications["tasks"] = approval_in.modified_tasks

        w = WorkflowService.resume_hitl_workflow(
            db=db,
            workflow_id=id,
            action="APPROVE" if approval_in.action.upper() != "MODIFY" else "MODIFY",
            modifications=modifications if modifications else None,
            feedback_notes=approval_in.feedback_notes
        )
        return get_workflow(w.id, db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{id}/reject", response_model=WorkflowRunRead)
def reject_hitl_workflow(id: str, approval_in: HITLApprovalRequest, db: Session = Depends(get_db)):
    try:
        w = WorkflowService.resume_hitl_workflow(
            db=db,
            workflow_id=id,
            action="REJECT",
            feedback_notes=approval_in.feedback_notes
        )
        return get_workflow(w.id, db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/trigger", response_model=WorkflowRunRead)
def trigger_workflow(request: WorkflowTriggerRequest, db: Session = Depends(get_db)):
    try:
        wf = WorkflowService.start_workflow(db, request.email_id)
        return get_workflow(wf.id, db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{id}/refine-draft", response_model=RefineDraftResponse)
def refine_workflow_draft_reply(id: str, payload: RefineDraftRequest, db: Session = Depends(get_db)):
    """
    Interactively refines the email draft response for a pending or running workflow.
    Uses multi-LLM factory or smart heuristic engine to revise tone and incorporate reviewer instructions.
    """
    wf = WorkflowService.get_workflow_by_id(db, id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow run not found")

    original_subject = wf.email.subject if wf.email else "Workflow Discussion"
    original_body = wf.email.body if wf.email else ""
    
    current_draft_body = payload.current_body
    if not current_draft_body and wf.draft_reply:
        current_draft_body = wf.draft_reply.get("body", "")

    if not current_draft_body:
        current_draft_body = f"Hi,\n\nRegarding '{original_subject}', we have received your request."

    refined = refine_draft_with_llm(
        original_subject=original_subject,
        original_body=original_body,
        current_draft=current_draft_body,
        instruction=payload.instruction,
        tone=payload.tone
    )

    return RefineDraftResponse(
        success=True,
        subject=refined.get("subject", f"Re: {original_subject}"),
        body=refined.get("body", current_draft_body),
        tone=refined.get("tone", payload.tone or "Professional"),
        refinement_applied=refined.get("refinement_applied", payload.instruction)
    )

