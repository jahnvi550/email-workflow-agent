"""
Multi-LLM Provider Factory supporting OpenAI, Groq, Ollama, and Intelligent Mock LLM.
"""

import json
import time
from typing import Dict, Any, Optional
from datetime import datetime
from backend.app.config import get_runtime_setting
from backend.app.agent.mock_llm import MockLLMEngine
from backend.app.agent.prompts import EXTRACTION_SYSTEM_PROMPT


def get_active_provider() -> str:
    return get_runtime_setting("llm_provider", "mock").lower()


def test_provider_connection(provider: str, api_key: Optional[str] = None, model: Optional[str] = None, base_url: Optional[str] = None) -> Dict[str, Any]:
    """Tests connectivity to a specific LLM provider."""
    start_time = time.time()
    provider = provider.lower()
    
    if provider == "mock":
        return {
            "success": True,
            "message": "Mock NLP Engine is fully operational with 0ms external latency.",
            "latency_ms": 1,
            "model_name": "Built-in Smart Mock LLM"
        }
        
    elif provider == "groq":
        key = api_key or get_runtime_setting("groq_api_key")
        if not key:
            return {"success": False, "message": "Groq API Key is missing.", "latency_ms": 0}
        try:
            from langchain_groq import ChatGroq
            from langchain_core.messages import HumanMessage
            selected_model = model or get_runtime_setting("groq_model", "llama-3.3-70b-versatile")
            llm = ChatGroq(groq_api_key=key, model_name=selected_model, temperature=0.1)
            response = llm.invoke([HumanMessage(content="Ping. Reply with 'pong' only.")])
            latency = int((time.time() - start_time) * 1000)
            return {
                "success": True,
                "message": f"Groq Connected ({selected_model}): {response.content.strip()}",
                "latency_ms": latency,
                "model_name": selected_model
            }
        except Exception as e:
            return {"success": False, "message": f"Groq Connection Failed: {str(e)}", "latency_ms": 0}

    elif provider == "openai":
        key = api_key or get_runtime_setting("openai_api_key")
        if not key:
            return {"success": False, "message": "OpenAI API Key is missing.", "latency_ms": 0}
        try:
            from langchain_openai import ChatOpenAI
            from langchain_core.messages import HumanMessage
            selected_model = model or get_runtime_setting("openai_model", "gpt-4o-mini")
            llm = ChatOpenAI(openai_api_key=key, model=selected_model, temperature=0.1)
            response = llm.invoke([HumanMessage(content="Ping. Reply with 'pong' only.")])
            latency = int((time.time() - start_time) * 1000)
            return {
                "success": True,
                "message": f"OpenAI Connected ({selected_model}): {response.content.strip()}",
                "latency_ms": latency,
                "model_name": selected_model
            }
        except Exception as e:
            return {"success": False, "message": f"OpenAI Connection Failed: {str(e)}", "latency_ms": 0}

    elif provider == "ollama":
        url = base_url or get_runtime_setting("ollama_base_url", "http://localhost:11434")
        selected_model = model or get_runtime_setting("ollama_model", "llama3")
        try:
            import requests
            resp = requests.get(f"{url}/api/tags", timeout=3)
            if resp.status_code == 200:
                latency = int((time.time() - start_time) * 1000)
                return {
                    "success": True,
                    "message": f"Ollama Local Server reachable at {url}",
                    "latency_ms": latency,
                    "model_name": selected_model
                }
            else:
                return {"success": False, "message": f"Ollama returned HTTP {resp.status_code}", "latency_ms": 0}
        except Exception as e:
            return {"success": False, "message": f"Ollama Connection Failed: {str(e)}", "latency_ms": 0}

    return {"success": False, "message": f"Unknown provider: {provider}", "latency_ms": 0}


def execute_llm_extraction(sender: str, subject: str, body: str) -> Dict[str, Any]:
    """
    Executes email analysis and structured extraction.
    Uses active provider (Groq / OpenAI / Ollama), with automatic fallback to MockLLMEngine.
    """
    provider = get_active_provider()
    
    if provider == "mock":
        return MockLLMEngine.analyze_email(sender, subject, body)
    
    current_time_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    prompt = EXTRACTION_SYSTEM_PROMPT.format(current_time=current_time_str)
    user_content = f"SENDER: {sender}\nSUBJECT: {subject}\nEMAIL BODY:\n{body}"
    
    try:
        if provider == "groq":
            key = get_runtime_setting("groq_api_key")
            if not key:
                return MockLLMEngine.analyze_email(sender, subject, body)
            from langchain_groq import ChatGroq
            from langchain_core.messages import SystemMessage, HumanMessage
            model_name = get_runtime_setting("groq_model", "llama-3.3-70b-versatile")
            llm = ChatGroq(groq_api_key=key, model_name=model_name, temperature=0.1, response_format={"type": "json_object"})
            res = llm.invoke([SystemMessage(content=prompt), HumanMessage(content=user_content)])
            raw_json = json.loads(res.content)
            return _normalize_llm_output(raw_json, sender, subject, body)

        elif provider == "openai":
            key = get_runtime_setting("openai_api_key")
            if not key:
                return MockLLMEngine.analyze_email(sender, subject, body)
            from langchain_openai import ChatOpenAI
            from langchain_core.messages import SystemMessage, HumanMessage
            model_name = get_runtime_setting("openai_model", "gpt-4o-mini")
            llm = ChatOpenAI(openai_api_key=key, model=model_name, temperature=0.1, model_kwargs={"response_format": {"type": "json_object"}})
            res = llm.invoke([SystemMessage(content=prompt), HumanMessage(content=user_content)])
            raw_json = json.loads(res.content)
            return _normalize_llm_output(raw_json, sender, subject, body)

        elif provider == "ollama":
            import requests
            url = get_runtime_setting("ollama_base_url", "http://localhost:11434")
            model_name = get_runtime_setting("ollama_model", "llama3")
            payload = {
                "model": model_name,
                "messages": [
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": user_content}
                ],
                "format": "json",
                "stream": False
            }
            resp = requests.post(f"{url}/api/chat", json=payload, timeout=30)
            if resp.status_code == 200:
                content = resp.json().get("message", {}).get("content", "{}")
                raw_json = json.loads(content)
                return _normalize_llm_output(raw_json, sender, subject, body)
            else:
                return MockLLMEngine.analyze_email(sender, subject, body)

    except Exception as e:
        print(f"[LLM Factory] Provider {provider} failed: {e}. Falling back to MockLLMEngine.")
        return MockLLMEngine.analyze_email(sender, subject, body)

    return MockLLMEngine.analyze_email(sender, subject, body)


def _normalize_llm_output(data: Dict[str, Any], sender: str, subject: str, body: str) -> Dict[str, Any]:
    """Ensures consistent schema shapes from external LLM outputs."""
    category = data.get("intent_category", "Task Assignment")
    priority = data.get("priority", "MEDIUM")
    confidence = float(data.get("confidence_score", 0.90))
    risk_level = data.get("risk_level", "LOW")
    tasks = data.get("tasks", [])
    meeting = data.get("meeting")
    draft_reply = data.get("draft_reply", {
        "recipient": sender,
        "subject": f"Re: {subject}",
        "body": f"Thank you for your message regarding {subject}. We are on it.\n\nBest regards,\nAgent",
        "tone": "Professional"
    })
    
    # Generate planned actions
    planned_actions = []
    for t in tasks:
        planned_actions.append({
            "action_type": "CREATE_TASK",
            "target": "Kanban Board",
            "description": f"Create task: {t.get('title', 'Task')}",
            "parameters": t
        })
    if meeting:
        planned_actions.append({
            "action_type": "SCHEDULE_CALENDAR",
            "target": "Calendar Service",
            "description": f"Reserve meeting: {meeting.get('title', 'Meeting')}",
            "parameters": meeting
        })
    planned_actions.append({
        "action_type": "DRAFT_EMAIL_REPLY",
        "target": "Email Dispatcher",
        "description": f"Prepare response to {sender}",
        "parameters": draft_reply
    })

    hitl_required = (risk_level == "HIGH" or confidence < 0.80)

    return {
        "intent_category": category,
        "priority": priority,
        "confidence_score": confidence,
        "risk_level": risk_level,
        "hitl_required": hitl_required,
        "hitl_reason": f"Evaluated as {risk_level} risk with {confidence*100:.0f}% confidence.",
        "extracted_entities": data.get("entities", {}),
        "extracted_tasks": tasks,
        "proposed_meeting": meeting,
        "draft_reply": draft_reply,
        "planned_actions": planned_actions
    }


def check_security_guardrails(sender: str, subject: str, body: str) -> Dict[str, Any]:
    """
    Executes security inspection on incoming email content.
    Identifies prompt injections, jailbreaks, data exfiltration, and malicious instruction overrides.
    """
    return MockLLMEngine.check_security(sender, subject, body)


def refine_draft_with_llm(
    original_subject: str,
    original_body: str,
    current_draft: str,
    instruction: str,
    tone: Optional[str] = None
) -> Dict[str, Any]:
    """
    Refines an email draft using active LLM provider (Groq / OpenAI / Ollama / Smart Mock).
    """
    provider = get_active_provider()
    
    if provider == "mock":
        return MockLLMEngine.refine_draft_reply(original_subject, original_body, current_draft, instruction, tone)
        
    system_prompt = (
        "You are an expert executive communication assistant. "
        "You are given an incoming email, a currently drafted response, and an instruction from a human reviewer. "
        "Rewrite the email response to satisfy the human instruction and chosen tone while maintaining professionalism. "
        "Respond ONLY with a valid JSON object matching this schema:\n"
        "{\n"
        '  "subject": "Re: ...",\n'
        '  "body": "Full revised email body text",\n'
        '  "tone": "Tone descriptor",\n'
        '  "refinement_applied": "Brief summary of change made"\n'
        "}"
    )
    user_prompt = (
        f"ORIGINAL EMAIL SUBJECT: {original_subject}\n"
        f"ORIGINAL EMAIL BODY:\n{original_body}\n\n"
        f"CURRENT DRAFT:\n{current_draft}\n\n"
        f"REQUESTED TONE: {tone or 'Professional'}\n"
        f"HUMAN INSTRUCTION: {instruction}"
    )

    try:
        if provider == "groq":
            key = get_runtime_setting("groq_api_key")
            if key:
                from langchain_groq import ChatGroq
                from langchain_core.messages import SystemMessage, HumanMessage
                model_name = get_runtime_setting("groq_model", "llama-3.3-70b-versatile")
                llm = ChatGroq(groq_api_key=key, model_name=model_name, temperature=0.3, response_format={"type": "json_object"})
                res = llm.invoke([SystemMessage(content=system_prompt), HumanMessage(content=user_prompt)])
                return json.loads(res.content)

        elif provider == "openai":
            key = get_runtime_setting("openai_api_key")
            if key:
                from langchain_openai import ChatOpenAI
                from langchain_core.messages import SystemMessage, HumanMessage
                model_name = get_runtime_setting("openai_model", "gpt-4o-mini")
                llm = ChatOpenAI(openai_api_key=key, model=model_name, temperature=0.3, model_kwargs={"response_format": {"type": "json_object"}})
                res = llm.invoke([SystemMessage(content=system_prompt), HumanMessage(content=user_prompt)])
                return json.loads(res.content)

    except Exception as e:
        print(f"[LLM Factory] Refinement via {provider} failed: {e}. Falling back to MockLLMEngine.")

    return MockLLMEngine.refine_draft_reply(original_subject, original_body, current_draft, instruction, tone)

