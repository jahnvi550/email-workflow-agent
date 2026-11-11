from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class SettingsRead(BaseModel):
    llm_provider: str
    openai_api_key_configured: bool
    openai_model: str
    groq_api_key_configured: bool
    groq_model: str
    ollama_base_url: str
    ollama_model: str
    autopilot_enabled: bool
    confidence_threshold: float
    require_hitl_on_high_risk: bool
    available_providers: List[str] = ["mock", "groq", "openai", "ollama"]


class SettingsUpdate(BaseModel):
    llm_provider: Optional[str] = None
    openai_api_key: Optional[str] = None
    openai_model: Optional[str] = None
    groq_api_key: Optional[str] = None
    groq_model: Optional[str] = None
    ollama_base_url: Optional[str] = None
    ollama_model: Optional[str] = None
    autopilot_enabled: Optional[bool] = None
    confidence_threshold: Optional[float] = None
    require_hitl_on_high_risk: Optional[bool] = None


class LLMTestRequest(BaseModel):
    provider: str
    api_key: Optional[str] = None
    model: Optional[str] = None
    base_url: Optional[str] = None


class LLMTestResponse(BaseModel):
    success: bool
    message: str
    latency_ms: Optional[int] = None
    model_name: Optional[str] = None
