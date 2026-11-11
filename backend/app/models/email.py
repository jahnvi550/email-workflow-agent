import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Boolean, JSON
from sqlalchemy.orm import relationship
from backend.app.database import Base


class EmailMessage(Base):
    __tablename__ = "emails"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    sender = Column(String(255), nullable=False)
    recipient = Column(String(255), default="user@organization.com")
    subject = Column(String(500), nullable=False)
    body = Column(Text, nullable=False)
    raw_headers = Column(JSON, nullable=True)
    received_at = Column(DateTime, default=datetime.utcnow)
    
    # Classification Metadata
    status = Column(String(50), default="UNPROCESSED")  # UNPROCESSED, PROCESSING, PROCESSED, FAILED
    priority = Column(String(20), default="MEDIUM")       # URGENT, HIGH, MEDIUM, LOW
    category = Column(String(50), default="General Inquiry") # Meeting Request, Task Assignment, Urgent Escalation, Bug Report, Contract Review, etc.
    is_starred = Column(Boolean, default=False)
    is_archived = Column(Boolean, default=False)
    thread_id = Column(String(100), nullable=True)
    
    # Relationships
    tasks = relationship("ExtractedTask", back_populates="email", cascade="all, delete-orphan")
    workflows = relationship("WorkflowRun", back_populates="email", cascade="all, delete-orphan")
    calendar_events = relationship("CalendarEvent", back_populates="email", cascade="all, delete-orphan")
