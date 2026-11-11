import uuid
from datetime import datetime
# pyrefly: ignore [missing-import]
from sqlalchemy import Column, String, Text, DateTime, Boolean, JSON
from backend.app.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    type = Column(String(50), default="INFO") # HITL_REQUEST, WORKFLOW_COMPLETE, TASK_DUE, SYSTEM_ALERT
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    metadata_json = Column(JSON, nullable=True) # {workflow_id, email_id, task_id}
    created_at = Column(DateTime, default=datetime.utcnow)
