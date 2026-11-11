"""
FastAPI Main Application Entrypoint for Email-to-Workflow AI Agent.
Includes continuous background email polling and LangGraph orchestrator.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.database import init_db
from backend.app.services.seed_service import seed_database
from backend.app.services.email_sync_service import EmailSyncService
from backend.app.routers import (
    auth_router,
    emails_router,
    tasks_router,
    workflows_router,
    calendar_router,
    notifications_router,
    analytics_router,
    settings_router
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Database, Seed initial demo workflows, and Start Background Polling Daemon
    print(f"[{settings.PROJECT_NAME}] Starting up...")
    init_db()
    seed_database()
    EmailSyncService.start(interval_seconds=20)
    yield
    print(f"[{settings.PROJECT_NAME}] Shutting down...")
    EmailSyncService.stop()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="LLM-Based Agent for Intelligent Email-to-Workflow Automation and Task Orchestration (LangGraph + APScheduler + HITL)",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers under /api and /api/v1 for universal compatibility
for prefix in ["/api", "/api/v1"]:
    app.include_router(auth_router, prefix=prefix)
    app.include_router(emails_router, prefix=prefix)
    app.include_router(tasks_router, prefix=prefix)
    app.include_router(workflows_router, prefix=prefix)
    app.include_router(calendar_router, prefix=prefix)
    app.include_router(notifications_router, prefix=prefix)
    app.include_router(analytics_router, prefix=prefix)
    app.include_router(settings_router, prefix=prefix)


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "llm_provider": settings.LLM_PROVIDER,
        "background_sync_active": EmailSyncService.is_active()
    }


@app.get("/", tags=["Root"])
def root_info():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "docs_url": "/docs",
        "redoc_url": "/redoc",
        "version": settings.VERSION,
        "batch_id": "05",
        "department": "Department of Computer Science & Engineering (Allied Branches)"
    }
