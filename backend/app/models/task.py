import uuid
from datetime import datetime
# pyrefly: ignore [missing-import]
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, JSON
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import relationship
from backend.app.database import Base


class ExtractedTask(Base):
    __tablename__ = "tasks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email_id = Column(String(36), ForeignKey("emails.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    deadline = Column(DateTime, nullable=True)
    priority = Column(String(20), default="MEDIUM")      # URGENT, HIGH, MEDIUM, LOW
    priority_reason = Column(String(255), nullable=True) # AI rationale for priority
    status = Column(String(30), default="TODO")          # TODO, IN_PROGRESS, UNDER_REVIEW, COMPLETED
    assignee = Column(String(100), default="AI Agent")
    estimated_hours = Column(String(50), nullable=True)  # e.g. "2h", "45m"
    subtasks = Column(JSON, default=list)                # [{"id": "1", "title": "...", "completed": False}]
    tags = Column(JSON, default=list)                    # e.g. ["Engineering", "Legal", "Client"]
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    email = relationship("EmailMessage", back_populates="tasks")

