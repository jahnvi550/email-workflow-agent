"""
Workflow Execution & Lifecycle Service managing LangGraph execution and HITL resumption.
"""

from datetime import datetime
from typing import Dict, Any, Optional, List
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from backend.app.models.workflow import WorkflowRun, WorkflowStep
from backend.app.models.email import EmailMessage
from backend.app.models.audit_log import AuditLog
from backend.app.models.notification import Notification
from backend.app.agent.graph import email_workflow_app, execute_actions_node, finalize_summary_node
from backend.app.agent.state import AgentState
from backend.app.tools.notification_tool import NotificationTool


class WorkflowService:
    @staticmethod
    def execute_workflow(db: Session, email_id: str, auto_run: bool = True) -> WorkflowRun:
        """Alias for starting or auto-running a workflow for an email."""
        return WorkflowService.start_workflow(db, email_id)

    @staticmethod
    def start_workflow(db: Session, email_id: str) -> WorkflowRun:
        """Initiates a fresh LangGraph orchestration run for an email."""
        email = db.query(EmailMessage).filter(EmailMessage.id == email_id).first()
        if not email:
            raise ValueError(f"Email with ID {email_id} not found.")

        # Check if an existing workflow run already exists for this email
        existing = db.query(WorkflowRun).filter(WorkflowRun.email_id == email_id).first()
        if existing and existing.state in ["RUNNING", "PENDING_APPROVAL", "COMPLETED"]:
            return existing

        # Create WorkflowRun record
        workflow = WorkflowRun(
            email_id=email_id,
            state="RUNNING",
            current_node="classify_and_extract",
            is_hitl_pending=False
        )
        db.add(workflow)
        db.commit()
        db.refresh(workflow)

        # Audit Log
        audit = AuditLog(
            action="WORKFLOW_STARTED",
            actor="AI_AGENT",
            entity_type="WORKFLOW",
            entity_id=workflow.id,
            details={"email_id": email_id, "subject": email.subject}
        )
        db.add(audit)
        db.commit()

        # Build initial AgentState
        initial_state: AgentState = {
            "email_id": email.id,
            "sender": email.sender,
            "recipient": email.recipient,
            "subject": email.subject,
            "body": email.body,
            "received_at": email.received_at.isoformat() if email.received_at else datetime.utcnow().isoformat(),
            "workflow_id": workflow.id,
            "execution_logs": []
        }

        # Invoke LangGraph StateGraph
        try:
            final_output = email_workflow_app.invoke(initial_state)
            
            # Refresh workflow record from DB
            db.refresh(workflow)
            return workflow
        except Exception as e:
            workflow.state = "FAILED"
            workflow.error_message = str(e)
            db.commit()
            print(f"[WorkflowService] Pipeline failed: {e}")
            raise e

    @staticmethod
    def resume_hitl_workflow(
        db: Session,
        workflow_id: str,
        action: str = "APPROVE",
        modifications: Optional[Dict[str, Any]] = None,
        feedback_notes: Optional[str] = None,
        modified_draft_reply: Optional[Dict[str, Any]] = None,
        modified_tasks: Optional[List[Dict[str, Any]]] = None,
        modified_meeting: Optional[Dict[str, Any]] = None
    ) -> WorkflowRun:
        """Resumes a paused workflow at the Human Approval Gate."""
        workflow = db.query(WorkflowRun).filter(WorkflowRun.id == workflow_id).first()
        if not workflow:
            raise ValueError(f"Workflow run {workflow_id} not found.")
        
        email = workflow.email

        # Consolidate modifications
        mods = modifications or {}
        if modified_draft_reply:
            mods["draft_reply"] = modified_draft_reply
        if modified_tasks:
            mods["tasks"] = modified_tasks
        if modified_meeting:
            mods["meeting"] = modified_meeting

        if action.upper() == "REJECT":
            workflow.state = "REJECTED"
            workflow.is_hitl_pending = False
            workflow.human_modifications = {"action": "REJECT", "feedback": feedback_notes}
            
            audit = AuditLog(
                action="HITL_REJECTED",
                actor="HUMAN_USER",
                entity_type="WORKFLOW",
                entity_id=workflow.id,
                details={"feedback": feedback_notes, "subject": email.subject if email else None}
            )
            db.add(audit)
            
            NotificationTool.push_notification(
                db=db,
                title="Workflow Rejected by User",
                message=f"Human operator rejected automated workflow for '{email.subject if email else workflow_id}'.",
                type_="SYSTEM_ALERT",
                metadata_json={"workflow_id": workflow_id}
            )
            
            if email:
                email.status = "PROCESSED"
            db.commit()
            db.refresh(workflow)
            return workflow

        # Handle APPROVE or MODIFY
        workflow.state = "RUNNING"
        workflow.is_hitl_pending = False
        workflow.human_modifications = mods
        db.commit()

        # Construct AgentState to resume directly into execute_actions and finalize_summary
        tasks_to_run = mods.get("tasks")
        if tasks_to_run is None:
            if isinstance(workflow.extracted_plan, list):
                tasks_to_run = [a.get("parameters") for a in workflow.extracted_plan if a.get("action_type") == "CREATE_TASK"]
            else:
                tasks_to_run = []

        resume_state: AgentState = {
            "email_id": email.id if email else "",
            "sender": email.sender if email else "",
            "recipient": email.recipient if email else "",
            "subject": email.subject if email else "",
            "body": email.body if email else "",
            "received_at": email.received_at.isoformat() if email and email.received_at else datetime.utcnow().isoformat(),
            "workflow_id": workflow.id,
            "intent_category": workflow.intent_category or "General Task",
            "priority": workflow.priority or "MEDIUM",
            "confidence_score": workflow.confidence_score or 0.95,
            "risk_level": workflow.risk_level or "LOW",
            "hitl_status": "APPROVED" if action.upper() == "APPROVE" else "MODIFIED",
            "human_modifications": mods,
            "extracted_tasks": tasks_to_run,
            "proposed_meeting": mods.get("meeting", workflow.proposed_meeting),
            "draft_reply": mods.get("draft_reply", workflow.draft_reply),
            "execution_logs": workflow.execution_logs or []
        }

        if not resume_state.get("extracted_tasks"):
            resume_state["extracted_tasks"] = [{
                "title": f"Process: {email.subject[:45]}" if email else "Process Email",
                "description": "Approved automated task.",
                "priority": workflow.priority or "MEDIUM",
                "assignee": "AI Agent",
                "tags": ["Approved-Workflow"]
            }]

        # Execute actions directly
        exec_output = execute_actions_node(resume_state)
        resume_state.update(exec_output)

        # Finalize summary
        final_output = finalize_summary_node(resume_state)
        resume_state.update(final_output)

        # Audit Log
        audit = AuditLog(
            action="HITL_APPROVED" if action.upper() == "APPROVE" else "HITL_MODIFIED",
            actor="HUMAN_USER",
            entity_type="WORKFLOW",
            entity_id=workflow.id,
            details={"modifications": mods, "feedback": feedback_notes}
        )
        db.add(audit)
        db.commit()
        db.refresh(workflow)
        return workflow

    @staticmethod
    def get_workflow_by_id(db: Session, workflow_id: str) -> Optional[WorkflowRun]:
        return db.query(WorkflowRun).filter(WorkflowRun.id == workflow_id).first()

    @staticmethod
    def list_workflows(db: Session, state: Optional[str] = None, limit: int = 50, offset: int = 0) -> List[WorkflowRun]:
        query = db.query(WorkflowRun).order_by(WorkflowRun.created_at.desc())
        if state:
            query = query.filter(WorkflowRun.state == state)
        return query.offset(offset).limit(limit).all()
