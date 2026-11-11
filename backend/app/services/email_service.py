"""
Email Processing and Ingestion Service.
"""

import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from backend.app.models.email import EmailMessage
from backend.app.models.audit_log import AuditLog
from backend.app.schemas.email_schemas import EmailCreate, EmailSimulateRequest
from backend.app.services.simulator_service import SimulatorService
from backend.app.services.workflow_service import WorkflowService


class EmailService:
    @staticmethod
    def create_email(db: Session, email_in: EmailCreate) -> EmailMessage:
        email = EmailMessage(
            sender=email_in.sender,
            recipient=email_in.recipient or "user@organization.com",
            subject=email_in.subject,
            body=email_in.body,
            received_at=email_in.received_at or datetime.utcnow(),
            priority=email_in.priority or "MEDIUM",
            category=email_in.category or "General Inquiry",
            status="UNPROCESSED",
            thread_id=f"thread-{uuid.uuid4().hex[:8]}"
        )
        db.add(email)
        db.commit()
        db.refresh(email)

        audit = AuditLog(
            action="EMAIL_INGESTED",
            actor="SYSTEM",
            entity_type="EMAIL",
            entity_id=email.id,
            details={"sender": email.sender, "subject": email.subject}
        )
        db.add(audit)
        db.commit()
        return email

    @staticmethod
    def simulate_email(db: Session, request: EmailSimulateRequest) -> Dict[str, Any]:
        """Simulates receiving an incoming email from preset or custom data and optionally executes workflow."""
        if request.preset_id:
            preset = SimulatorService.get_preset_by_id(request.preset_id)
            sender = preset["sender"]
            subject = preset["subject"]
            body = preset["body"]
            priority = preset["priority"]
            category = preset["category"]
        else:
            sender = request.custom_sender or "colleague@organization.com"
            subject = request.custom_subject or "Project Sync & Action Items"
            body = request.custom_body or "Please review the attached project specs and let me know your thoughts."
            priority = "MEDIUM"
            category = "Task Assignment"

        email = EmailMessage(
            sender=sender,
            recipient="user@organization.com",
            subject=subject,
            body=body,
            received_at=datetime.utcnow(),
            priority=priority,
            category=category,
            status="UNPROCESSED",
            thread_id=f"thread-{uuid.uuid4().hex[:8]}"
        )
        db.add(email)
        db.commit()
        db.refresh(email)

        audit = AuditLog(
            action="EMAIL_SIMULATED",
            actor="HUMAN_USER",
            entity_type="EMAIL",
            entity_id=email.id,
            details={"preset_id": request.preset_id, "subject": email.subject}
        )
        db.add(audit)
        db.commit()

        workflow_run = None
        if request.auto_process:
            workflow_run = WorkflowService.start_workflow(db, email.id)

        return {
            "email": email,
            "workflow_run": workflow_run
        }

    @staticmethod
    def get_email_by_id(db: Session, email_id: str) -> Optional[EmailMessage]:
        return db.query(EmailMessage).filter(EmailMessage.id == email_id).first()

    @staticmethod
    def list_emails(
        db: Session,
        category: Optional[str] = None,
        priority: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[EmailMessage]:
        from sqlalchemy import case
        
        priority_order = case(
            (EmailMessage.priority == "URGENT", 1),
            (EmailMessage.priority == "HIGH", 2),
            (EmailMessage.priority == "MEDIUM", 3),
            (EmailMessage.priority == "LOW", 4),
            else_=5
        )
        
        query = db.query(EmailMessage).order_by(priority_order, EmailMessage.received_at.desc())
        
        if category:
            query = query.filter(EmailMessage.category == category)
        if priority:
            query = query.filter(EmailMessage.priority == priority)
        if status:
            query = query.filter(EmailMessage.status == status)
        if search:
            query = query.filter(
                (EmailMessage.subject.ilike(f"%{search}%")) |
                (EmailMessage.sender.ilike(f"%{search}%")) |
                (EmailMessage.body.ilike(f"%{search}%"))
            )
            
        return query.offset(offset).limit(limit).all()

    @staticmethod
    def update_email_flags(db: Session, email_id: str, is_starred: Optional[bool] = None, is_archived: Optional[bool] = None) -> Optional[EmailMessage]:
        email = db.query(EmailMessage).filter(EmailMessage.id == email_id).first()
        if not email:
            return None
        if is_starred is not None:
            email.is_starred = is_starred
        if is_archived is not None:
            email.is_archived = is_archived
        db.commit()
        db.refresh(email)
        return email

    @staticmethod
    def delete_email(db: Session, email_id: str) -> bool:
        email = db.query(EmailMessage).filter(EmailMessage.id == email_id).first()
        if not email:
            return False
        db.delete(email)
        db.commit()
        return True
