from backend.app.routers.auth import router as auth_router
from backend.app.routers.emails import router as emails_router
from backend.app.routers.tasks import router as tasks_router
from backend.app.routers.workflows import router as workflows_router
from backend.app.routers.calendar import router as calendar_router
from backend.app.routers.notifications import router as notifications_router
from backend.app.routers.analytics import router as analytics_router
from backend.app.routers.settings import router as settings_router

__all__ = [
    "auth_router",
    "emails_router",
    "tasks_router",
    "workflows_router",
    "calendar_router",
    "notifications_router",
    "analytics_router",
    "settings_router"
]
