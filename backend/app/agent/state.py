from typing import TypedDict, List, Dict, Any, Optional
from datetime import datetime


class ExtractedTaskDict(TypedDict, total=False):
    title: str
    description: str
    deadline: Optional[str] # ISO format string or YYYY-MM-DD HH:MM
    priority: str          # URGENT, HIGH, MEDIUM, LOW
    assignee: str
    tags: List[str]


class ProposedMeetingDict(TypedDict, total=False):
    title: str
    start_time: str
    end_time: str
    attendees: List[str]
    is_required: bool
    location: str


class DraftReplyDict(TypedDict, total=False):
    recipient: str
    subject: str
    body: str
    tone: str # Professional, Urgent, Cordial, Concise


class StepExecutionLog(TypedDict, total=False):
    node: str
    timestamp: str
    status: str
    details: str
    duration_ms: int


class AgentState(TypedDict, total=False):
    # Email Ingestion context
    email_id: str
    sender: str
    recipient: str
    subject: str
    body: str
    received_at: str
    
    # Workflow runtime reference
    workflow_id: str
    
    # Step 1: Extraction & Classification
    intent_category: str # "Meeting Request", "Task Assignment", "Urgent Escalation", "Bug Report", "Contract Review", "General Inquiry"
    priority: str        # "URGENT", "HIGH", "MEDIUM", "LOW"
    confidence_score: float # 0.0 to 1.0
    extracted_entities: Dict[str, Any]
    extracted_tasks: List[ExtractedTaskDict]
    proposed_meeting: Optional[ProposedMeetingDict]
    draft_reply: Optional[DraftReplyDict]
    
    # Step 2: Orchestration Plan
    planned_actions: List[Dict[str, Any]]
    
    # Step 3: Risk & HITL Evaluation
    risk_level: str # "LOW", "MEDIUM", "HIGH"
    hitl_required: bool
    hitl_reason: str
    hitl_status: str # "PENDING", "APPROVED", "REJECTED", "MODIFIED", "SKIPPED"
    is_security_flagged: bool
    security_assessment_reason: Optional[str]
    security_flags: List[str]
    
    # Step 4: Human Feedback / Interventions
    human_modifications: Optional[Dict[str, Any]]
    
    # Step 5: Execution outputs
    created_task_ids: List[str]
    created_event_id: Optional[str]
    email_reply_sent: bool
    notifications_pushed: List[str]
    
    # Step 6: Finalization & Audit
    execution_logs: List[StepExecutionLog]
    current_node: str
    error: Optional[str]

