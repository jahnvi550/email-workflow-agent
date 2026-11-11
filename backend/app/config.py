import os
from typing import List, Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Email-to-Workflow AI Agent"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"
    
    # Database
    DATABASE_URL: str = "sqlite:///./email_agent.db"
    
    # LLM Settings & Provider Selection (mock | openai | groq | ollama)
    LLM_PROVIDER: str = "mock"
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o-mini"
    
    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3"
    
    # Automation & HITL
    AUTOPILOT_ENABLED: bool = False
    CONFIDENCE_THRESHOLD: float = 0.85
    REQUIRE_HITL_ON_HIGH_RISK: bool = True
    
    # CORS
    CORS_ORIGINS: List[str] = ["*"]
    
    # Background Scheduler
    SCHEDULER_ENABLED: bool = True
    SIMULATION_INTERVAL_MINUTES: int = 15

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()

# Runtime mutable state for settings dynamically changed from UI
runtime_settings = {
    "llm_provider": settings.LLM_PROVIDER,
    "openai_api_key": settings.OPENAI_API_KEY,
    "openai_model": settings.OPENAI_MODEL,
    "groq_api_key": settings.GROQ_API_KEY,
    "groq_model": settings.GROQ_MODEL,
    "ollama_base_url": settings.OLLAMA_BASE_URL,
    "ollama_model": settings.OLLAMA_MODEL,
    "autopilot_enabled": settings.AUTOPILOT_ENABLED,
    "confidence_threshold": settings.CONFIDENCE_THRESHOLD,
    "require_hitl_on_high_risk": settings.REQUIRE_HITL_ON_HIGH_RISK,
}


def get_runtime_setting(key: str, default=None):
    return runtime_settings.get(key, default)


def update_runtime_setting(key: str, value):
    runtime_settings[key] = value
