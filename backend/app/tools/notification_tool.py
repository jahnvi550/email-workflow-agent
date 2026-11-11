"""
Notification Tool for pushing in-app toasts and audit records.
"""

from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.models.notification import Notification
from backend.app.models.audit_log import AuditLog


class NotificationTool:
    @staticmethod
    def push_notification(
        db: Session,
        title: str,
        message: str,
        type_: str = "INFO",
        metadata_json: Optional[Dict[str, Any]] = None
    ) -> Notification:
        """Pushes a system/agent notification to the inbox notification bell."""
        notif = Notification(
            type=type_,
            title=title,
            message=message,
            metadata_json=metadata_json or {}
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)
        return notif
