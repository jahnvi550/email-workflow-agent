import uuid
from datetime import datetime
# pyrefly: ignore [missing-import]
from sqlalchemy import Column, String, Text, DateTime, JSON
from backend.app.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    action = Column(String(100), nullable=False) # e.g. "EMAIL_INGESTED", "WORKFLOW_STARTED", "TASK_CREATED", "CALENDAR_BOOKED", "EMAIL_REPLIED", "HITL_APPROVED", "HITL_REJECTED"
    actor = Column(String(100), default="AI_AGENT") # "AI_AGENT", "HUMAN_USER", "SYSTEM"
    entity_type = Column(String(50), nullable=True) # "EMAIL", "WORKFLOW", "TASK", "EVENT"
    entity_id = Column(String(36), nullable=True)
    details = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
