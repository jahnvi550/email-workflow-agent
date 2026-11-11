import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Boolean, Float, JSON, Integer
from sqlalchemy.orm import relationship
from backend.app.database import Base


class WorkflowRun(Base):
    __tablename__ = "workflow_runs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email_id = Column(String(36), ForeignKey("emails.id", ondelete="CASCADE"), nullable=False)
    
    # State tracking
    state = Column(String(50), default="INITIALIZING")  # INITIALIZING, RUNNING, PENDING_APPROVAL, APPROVED, REJECTED, COMPLETED, FAILED
    current_node = Column(String(50), default="classify_and_extract")
    is_hitl_pending = Column(Boolean, default=False)
    
    # Analysis & Plan Results
    intent_category = Column(String(100), nullable=True)
    priority = Column(String(20), default="MEDIUM")
    confidence_score = Column(Float, default=0.0)
    risk_level = Column(String(20), default="LOW") # LOW, MEDIUM, HIGH
    
    # Structured Payloads
    extracted_plan = Column(JSON, default=list)
    draft_reply = Column(JSON, nullable=True)
    proposed_meeting = Column(JSON, nullable=True)
    human_modifications = Column(JSON, nullable=True)
    execution_logs = Column(JSON, default=list)
    error_message = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    email = relationship("EmailMessage", back_populates="workflows")
    steps = relationship("WorkflowStep", back_populates="workflow", cascade="all, delete-orphan", order_by="WorkflowStep.created_at")


class WorkflowStep(Base):
    __tablename__ = "workflow_steps"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workflow_id = Column(String(36), ForeignKey("workflow_runs.id", ondelete="CASCADE"), nullable=False)
    node_name = Column(String(50), nullable=False) # classify_and_extract, plan_orchestration, evaluate_risk_and_hitl, human_approval_gate, execute_actions, finalize_summary
    status = Column(String(20), default="COMPLETED") # RUNNING, COMPLETED, SKIPPED, FAILED
    input_state = Column(JSON, nullable=True)
    output_state = Column(JSON, nullable=True)
    duration_ms = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    workflow = relationship("WorkflowRun", back_populates="steps")
