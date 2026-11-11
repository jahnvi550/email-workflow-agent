"""
LangGraph StateGraph for Email-to-Workflow Automation and Task Orchestration.
"""

import time
from datetime import datetime
from typing import Dict, Any, Literal
from langgraph.graph import StateGraph, END
from backend.app.agent.state import AgentState
from backend.app.agent.llm_factory import execute_llm_extraction, check_security_guardrails
from backend.app.config import get_runtime_setting
from backend.app.database import SessionLocal
from backend.app.tools.task_tool import TaskTool
from backend.app.tools.calendar_tool import CalendarTool
from backend.app.tools.email_tool import EmailTool
from backend.app.tools.notification_tool import NotificationTool
from backend.app.models.workflow import WorkflowRun, WorkflowStep
from backend.app.models.email import EmailMessage
from backend.app.models.audit_log import AuditLog


def _record_step(workflow_id: str, node_name: str, status: str, duration_ms: int, input_state: Any, output_state: Any):
    """Helper to persist discrete step execution history."""
    if not workflow_id:
        return
    db = SessionLocal()
    try:
        step = WorkflowStep(
            workflow_id=workflow_id,
            node_name=node_name,
            status=status,
            duration_ms=duration_ms,
            input_state={"preview": str(input_state)[:200]} if input_state else None,
            output_state={"preview": str(output_state)[:200]} if output_state else None
        )
        db.add(step)
        
        # Update workflow current node
        wf = db.query(WorkflowRun).filter(WorkflowRun.id == workflow_id).first()
        if wf:
            wf.current_node = node_name
            wf.updated_at = datetime.utcnow()
        db.commit()
    except Exception as e:
        print(f"[Graph] Error saving step {node_name}: {e}")
    finally:
        db.close()


# -------------------------------------------------------------
# Node 0: Security & Guardrail Check
# -------------------------------------------------------------
def security_guardrail_node(state: AgentState) -> Dict[str, Any]:
    start_time = time.time()
    sender = state.get("sender", "")
    subject = state.get("subject", "")
    body = state.get("body", "")
    workflow_id = state.get("workflow_id", "")
    
    sec_eval = check_security_guardrails(sender, subject, body)
    duration = int((time.time() - start_time) * 1000)
    
    status_str = "FLAGGED" if sec_eval.get("is_flagged") else "PASSED"
    _record_step(workflow_id, "security_guardrail", status_str, duration, {"subject": subject}, sec_eval)
    
    log_entry = {
        "node": "security_guardrail",
        "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
        "status": "WARNING" if sec_eval.get("is_flagged") else "SUCCESS",
        "details": f"Security Guardrail: {sec_eval.get('reason')}",
        "duration_ms": duration
    }
    logs = list(state.get("execution_logs", []))
    logs.append(log_entry)
    
    return {
        "is_security_flagged": sec_eval.get("is_flagged", False),
        "security_assessment_reason": sec_eval.get("reason"),
        "security_flags": sec_eval.get("flags", []),
        "execution_logs": logs,
        "current_node": "security_guardrail"
    }



# -------------------------------------------------------------
# Node 1: Classify and Extract
# -------------------------------------------------------------
def classify_and_extract_node(state: AgentState) -> Dict[str, Any]:
    start_time = time.time()
    sender = state.get("sender", "")
    subject = state.get("subject", "")
    body = state.get("body", "")
    workflow_id = state.get("workflow_id", "")
    
    extracted = execute_llm_extraction(sender, subject, body)
    duration = int((time.time() - start_time) * 1000)
    
    # Update email category & priority in DB
    db = SessionLocal()
    try:
        email_id = state.get("email_id")
        if email_id:
            email = db.query(EmailMessage).filter(EmailMessage.id == email_id).first()
            if email:
                email.category = extracted["intent_category"]
                email.priority = extracted["priority"]
                email.status = "PROCESSING"
                db.commit()
    finally:
        db.close()

    _record_step(workflow_id, "classify_and_extract", "COMPLETED", duration, {"subject": subject}, extracted)

    log_entry = {
        "node": "classify_and_extract",
        "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
        "status": "SUCCESS",
        "details": f"Classified intent as '{extracted['intent_category']}' with {extracted['confidence_score']*100:.0f}% confidence.",
        "duration_ms": duration
    }
    
    logs = list(state.get("execution_logs", []))
    logs.append(log_entry)

    return {
        "intent_category": extracted["intent_category"],
        "priority": extracted["priority"],
        "confidence_score": extracted["confidence_score"],
        "risk_level": extracted["risk_level"],
        "hitl_required": extracted["hitl_required"],
        "hitl_reason": extracted["hitl_reason"],
        "extracted_entities": extracted["extracted_entities"],
        "extracted_tasks": extracted["extracted_tasks"],
        "proposed_meeting": extracted["proposed_meeting"],
        "draft_reply": extracted["draft_reply"],
        "planned_actions": extracted["planned_actions"],
        "execution_logs": logs,
        "current_node": "classify_and_extract"
    }


# -------------------------------------------------------------
# Node 2: Plan Orchestration
# -------------------------------------------------------------
def plan_orchestration_node(state: AgentState) -> Dict[str, Any]:
    start_time = time.time()
    workflow_id = state.get("workflow_id", "")
    planned_actions = state.get("planned_actions", [])
    
    duration = int((time.time() - start_time) * 1000)
    _record_step(workflow_id, "plan_orchestration", "COMPLETED", duration, {}, {"actions_count": len(planned_actions)})
    
    log_entry = {
        "node": "plan_orchestration",
        "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
        "status": "SUCCESS",
        "details": f"Generated multi-step plan containing {len(planned_actions)} actions.",
        "duration_ms": duration
    }
    logs = list(state.get("execution_logs", []))
    logs.append(log_entry)
    
    return {
        "execution_logs": logs,
        "current_node": "plan_orchestration"
    }


# -------------------------------------------------------------
# Node 3: Evaluate Risk and HITL
# -------------------------------------------------------------
def evaluate_risk_and_hitl_node(state: AgentState) -> Dict[str, Any]:
    start_time = time.time()
    workflow_id = state.get("workflow_id", "")
    
    autopilot_enabled = get_runtime_setting("autopilot_enabled", False)
    confidence_threshold = get_runtime_setting("confidence_threshold", 0.85)
    require_hitl_on_high_risk = get_runtime_setting("require_hitl_on_high_risk", True)
    
    risk_level = state.get("risk_level", "LOW")
    confidence_score = state.get("confidence_score", 0.90)
    base_hitl_required = state.get("hitl_required", False)
    is_security_flagged = state.get("is_security_flagged", False)
    
    # Calculate final HITL gate requirement
    if is_security_flagged:
        hitl_required = True
        risk_level = "HIGH"
        reason = f"SECURITY ALERT: {state.get('security_assessment_reason', 'Prompt Injection / Adversarial Input Detected.')} Mandatory human verification required."
    elif not autopilot_enabled:
        hitl_required = True
        reason = "Autopilot is disabled; all staged workflows require human verification."
    elif require_hitl_on_high_risk and risk_level == "HIGH":
        hitl_required = True
        reason = "High-risk category (financial / legal / outage) triggered mandatory safety gate."
    elif confidence_score < confidence_threshold:
        hitl_required = True
        reason = f"Extraction confidence ({confidence_score:.2f}) below threshold ({confidence_threshold:.2f})."
    else:
        hitl_required = False
        reason = "Passed all autopilot safety gates for automated execution."


    duration = int((time.time() - start_time) * 1000)
    
    # Update workflow status in DB
    db = SessionLocal()
    try:
        wf = db.query(WorkflowRun).filter(WorkflowRun.id == workflow_id).first()
        if wf:
            wf.risk_level = risk_level
            wf.confidence_score = confidence_score
            wf.intent_category = state.get("intent_category")
            wf.priority = state.get("priority", "MEDIUM")
            wf.extracted_plan = state.get("planned_actions")
            wf.draft_reply = state.get("draft_reply")
            wf.proposed_meeting = state.get("proposed_meeting")
            wf.is_hitl_pending = hitl_required
            wf.state = "PENDING_APPROVAL" if hitl_required else "RUNNING"
            db.commit()
            
            if hitl_required:
                NotificationTool.push_notification(
                    db=db,
                    title="Human Approval Needed",
                    message=f"Email '{state.get('subject')}' requires review ({state.get('intent_category')}).",
                    type_="HITL_REQUEST",
                    metadata_json={"workflow_id": workflow_id, "email_id": state.get("email_id")}
                )
    finally:
        db.close()

    _record_step(workflow_id, "evaluate_risk_and_hitl", "COMPLETED", duration, {}, {"hitl_required": hitl_required, "reason": reason})

    log_entry = {
        "node": "evaluate_risk_and_hitl",
        "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
        "status": "SUCCESS",
        "details": f"HITL Assessment: {'REQUIRED' if hitl_required else 'AUTONOMOUS'}. {reason}",
        "duration_ms": duration
    }
    logs = list(state.get("execution_logs", []))
    logs.append(log_entry)

    return {
        "hitl_required": hitl_required,
        "hitl_reason": reason,
        "hitl_status": "PENDING" if hitl_required else "SKIPPED",
        "execution_logs": logs,
        "current_node": "evaluate_risk_and_hitl"
    }


# -------------------------------------------------------------
# Conditional Edge: Route after Risk Evaluation
# -------------------------------------------------------------
def route_after_risk_eval(state: AgentState) -> Literal["human_approval_gate", "execute_actions"]:
    if state.get("hitl_required", False) and state.get("hitl_status") == "PENDING":
        return "human_approval_gate"
    return "execute_actions"


# -------------------------------------------------------------
# Node 4: Human Approval Gate
# -------------------------------------------------------------
def human_approval_gate_node(state: AgentState) -> Dict[str, Any]:
    """
    Acts as a checkpoint node. When invoked initially, sets state to PENDING.
    When resumed with human_modifications or APPROVED action, passes through.
    """
    workflow_id = state.get("workflow_id", "")
    hitl_status = state.get("hitl_status", "PENDING")
    
    log_entry = {
        "node": "human_approval_gate",
        "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
        "status": hitl_status,
        "details": f"Workflow is at Human Approval checkpoint (Status: {hitl_status}).",
        "duration_ms": 0
    }
    logs = list(state.get("execution_logs", []))
    logs.append(log_entry)

    return {
        "execution_logs": logs,
        "current_node": "human_approval_gate"
    }


# -------------------------------------------------------------
# Node 5: Execute Actions
# -------------------------------------------------------------
def execute_actions_node(state: AgentState) -> Dict[str, Any]:
    start_time = time.time()
    workflow_id = state.get("workflow_id", "")
    email_id = state.get("email_id")
    
    # Check if modifications were provided by human
    mods = state.get("human_modifications") or {}
    tasks_to_create = mods.get("tasks", state.get("extracted_tasks", []))
    meeting_to_create = mods.get("meeting", state.get("proposed_meeting"))
    draft_reply = mods.get("draft_reply", state.get("draft_reply"))
    
    created_task_ids = []
    created_event_id = None
    email_reply_sent = False
    notifications_pushed = []

    db = SessionLocal()
    try:
        # 1. Create Tasks in DB
        for t in tasks_to_create:
            task_obj = TaskTool.create_task_from_dict(db, email_id, t)
            created_task_ids.append(task_obj.id)

        # 2. Schedule Calendar Event
        if meeting_to_create and meeting_to_create.get("is_required", True):
            event_obj = CalendarTool.schedule_meeting(db, email_id, meeting_to_create)
            created_event_id = event_obj.id

        # 3. Dispatch / stage email reply
        if draft_reply:
            EmailTool.send_reply(db, email_id, draft_reply, actor="AI_AGENT" if not mods else "HUMAN_APPROVED_AGENT")
            email_reply_sent = True

        # 4. Push Completion Notification
        notif = NotificationTool.push_notification(
            db=db,
            title="Workflow Executed Successfully",
            message=f"Created {len(created_task_ids)} tasks and processed email '{state.get('subject')}'.",
            type_="WORKFLOW_COMPLETE",
            metadata_json={"workflow_id": workflow_id, "tasks_count": len(created_task_ids)}
        )
        notifications_pushed.append(notif.id)

        # Update WorkflowRun
        wf = db.query(WorkflowRun).filter(WorkflowRun.id == workflow_id).first()
        if wf:
            wf.state = "COMPLETED"
            wf.is_hitl_pending = False
            wf.updated_at = datetime.utcnow()
            db.commit()

    except Exception as e:
        print(f"[Graph] Error during execute_actions: {e}")
    finally:
        db.close()

    duration = int((time.time() - start_time) * 1000)
    _record_step(workflow_id, "execute_actions", "COMPLETED", duration, {}, {
        "created_task_ids": created_task_ids,
        "created_event_id": created_event_id,
        "email_reply_sent": email_reply_sent
    })

    log_entry = {
        "node": "execute_actions",
        "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
        "status": "SUCCESS",
        "details": f"Successfully executed tools: {len(created_task_ids)} tasks created, meeting booked, reply staged.",
        "duration_ms": duration
    }
    logs = list(state.get("execution_logs", []))
    logs.append(log_entry)

    return {
        "created_task_ids": created_task_ids,
        "created_event_id": created_event_id,
        "email_reply_sent": email_reply_sent,
        "notifications_pushed": notifications_pushed,
        "execution_logs": logs,
        "current_node": "execute_actions"
    }


# -------------------------------------------------------------
# Node 6: Finalize Summary
# -------------------------------------------------------------
def finalize_summary_node(state: AgentState) -> Dict[str, Any]:
    start_time = time.time()
    workflow_id = state.get("workflow_id", "")
    
    db = SessionLocal()
    try:
        wf = db.query(WorkflowRun).filter(WorkflowRun.id == workflow_id).first()
        if wf:
            wf.execution_logs = state.get("execution_logs", [])
            db.commit()

        audit = AuditLog(
            action="WORKFLOW_FINALIZED",
            actor="AI_AGENT",
            entity_type="WORKFLOW",
            entity_id=workflow_id,
            details={
                "tasks_count": len(state.get("created_task_ids", [])),
                "has_meeting": bool(state.get("created_event_id")),
                "reply_sent": state.get("email_reply_sent", False)
            }
        )
        db.add(audit)
        db.commit()
    finally:
        db.close()

    duration = int((time.time() - start_time) * 1000)
    _record_step(workflow_id, "finalize_summary", "COMPLETED", duration, {}, {"final_status": "COMPLETED"})

    log_entry = {
        "node": "finalize_summary",
        "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
        "status": "SUCCESS",
        "details": "Workflow finalized. Audit logs and metrics updated.",
        "duration_ms": duration
    }
    logs = list(state.get("execution_logs", []))
    logs.append(log_entry)

    return {
        "execution_logs": logs,
        "current_node": "finalize_summary"
    }


# -------------------------------------------------------------
# Compile LangGraph StateGraph
# -------------------------------------------------------------
def build_email_workflow_graph():
    builder = StateGraph(AgentState)

    # Register Nodes
    builder.add_node("security_guardrail", security_guardrail_node)
    builder.add_node("classify_and_extract", classify_and_extract_node)
    builder.add_node("plan_orchestration", plan_orchestration_node)
    builder.add_node("evaluate_risk_and_hitl", evaluate_risk_and_hitl_node)
    builder.add_node("human_approval_gate", human_approval_gate_node)
    builder.add_node("execute_actions", execute_actions_node)
    builder.add_node("finalize_summary", finalize_summary_node)

    # Set Entry Point
    builder.set_entry_point("security_guardrail")

    # Add Normal Transitions
    builder.add_edge("security_guardrail", "classify_and_extract")
    builder.add_edge("classify_and_extract", "plan_orchestration")
    builder.add_edge("plan_orchestration", "evaluate_risk_and_hitl")


    # Conditional Branch after Risk Evaluation
    builder.add_conditional_edges(
        "evaluate_risk_and_hitl",
        route_after_risk_eval,
        {
            "human_approval_gate": "human_approval_gate",
            "execute_actions": "execute_actions"
        }
    )

    # Transitions from Human Gate and Execution
    builder.add_edge("human_approval_gate", END)
    builder.add_edge("execute_actions", "finalize_summary")
    builder.add_edge("finalize_summary", END)

    return builder.compile()


email_workflow_app = build_email_workflow_graph()
