from fastapi import APIRouter, HTTPException
from backend.app.config import get_runtime_setting, update_runtime_setting
from backend.app.schemas.settings_schemas import SettingsRead, SettingsUpdate, LLMTestRequest, LLMTestResponse
from backend.app.agent.llm_factory import test_provider_connection

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("", response_model=SettingsRead)
def get_settings():
    return SettingsRead(
        llm_provider=get_runtime_setting("llm_provider", "mock"),
        openai_api_key_configured=bool(get_runtime_setting("openai_api_key")),
        openai_model=get_runtime_setting("openai_model", "gpt-4o-mini"),
        groq_api_key_configured=bool(get_runtime_setting("groq_api_key")),
        groq_model=get_runtime_setting("groq_model", "llama-3.3-70b-versatile"),
        ollama_base_url=get_runtime_setting("ollama_base_url", "http://localhost:11434"),
        ollama_model=get_runtime_setting("ollama_model", "llama3"),
        autopilot_enabled=get_runtime_setting("autopilot_enabled", False),
        confidence_threshold=get_runtime_setting("confidence_threshold", 0.85),
        require_hitl_on_high_risk=get_runtime_setting("require_hitl_on_high_risk", True),
        available_providers=["mock", "groq", "openai", "ollama"]
    )


@router.post("", response_model=SettingsRead)
def update_settings(update_in: SettingsUpdate):
    update_data = update_in.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        if v is not None:
            update_runtime_setting(k, v)
            
    return get_settings()


@router.post("/test-llm", response_model=LLMTestResponse)
def test_llm(req: LLMTestRequest):
    res = test_provider_connection(
        provider=req.provider,
        api_key=req.api_key,
        model=req.model,
        base_url=req.base_url
    )
    return LLMTestResponse(
        success=res.get("success", False),
        message=res.get("message", ""),
        latency_ms=res.get("latency_ms"),
        model_name=res.get("model_name")
    )


@router.post("/purge-data")
def purge_workspace_data():
    """Purges all emails, tasks, workflows, meetings, and notifications from the database."""
    from backend.app.services.seed_service import clear_all_demo_data
    clear_all_demo_data()
    return {"success": True, "message": "All workspace data purged successfully. Environment is 100% clean."}

