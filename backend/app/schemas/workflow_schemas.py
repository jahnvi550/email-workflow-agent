from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class WorkflowStepRead(BaseModel):
    id: str
    workflow_id: str
    node_name: str
    status: str
    input_state: Optional[Dict[str, Any]] = None
    output_state: Optional[Dict[str, Any]] = None
    duration_ms: int
    created_at: datetime

    class Config:
        from_attributes = True


class HITLApprovalRequest(BaseModel):
    action: str = "APPROVE"  # APPROVE, REJECT, MODIFY
    modified_draft_reply: Optional[Dict[str, Any]] = None
    modified_meeting: Optional[Dict[str, Any]] = None
    modified_tasks: Optional[List[Dict[str, Any]]] = None
    feedback_notes: Optional[str] = None


class WorkflowTriggerRequest(BaseModel):
    email_id: str
    force_restart: bool = False


class WorkflowRunRead(BaseModel):
    id: str
    email_id: str
    state: str
    current_node: str
    is_hitl_pending: bool
    intent_category: Optional[str] = None
    priority: str
    confidence_score: float
    risk_level: str
    extracted_plan: Optional[List[Dict[str, Any]]] = None
    draft_reply: Optional[Dict[str, Any]] = None
    proposed_meeting: Optional[Dict[str, Any]] = None
    human_modifications: Optional[Dict[str, Any]] = None
    execution_logs: Optional[List[Dict[str, Any]]] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    steps: List[WorkflowStepRead] = []
    email_subject: Optional[str] = None
    email_sender: Optional[str] = None

    class Config:
        from_attributes = True


class RefineDraftRequest(BaseModel):
    instruction: str
    tone: Optional[str] = "Professional"
    current_body: Optional[str] = None


class RefineDraftResponse(BaseModel):
    success: bool
    subject: str
    body: str
    tone: str
    refinement_applied: str

