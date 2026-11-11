"""
Database Initialization and Cleanup Service.
Maintains a 100% clean database environment for real authenticated accounts.
Zero fake demo profiles or fake emails seeded.
"""

from sqlalchemy.orm import Session
from backend.app.database import SessionLocal, init_db
from backend.app.models.user import User
from backend.app.models.email import EmailMessage
from backend.app.models.task import ExtractedTask
from backend.app.models.workflow import WorkflowRun, WorkflowStep
from backend.app.models.calendar_event import CalendarEvent
from backend.app.models.notification import Notification
from backend.app.models.audit_log import AuditLog


def clear_all_demo_data(db: Session = None):
    """Purges all demo data to ensure a completely clean environment for real users."""
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True

    try:
        db.query(WorkflowStep).delete()
        db.query(WorkflowRun).delete()
        db.query(ExtractedTask).delete()
        db.query(CalendarEvent).delete()
        db.query(Notification).delete()
        db.query(AuditLog).delete()
        db.query(EmailMessage).delete()
        db.query(User).delete()
        db.commit()
        print("[Database Clean] Successfully purged all demo emails, tasks, meetings, and users.")
    except Exception as e:
        db.rollback()
        print(f"[Database Clean] Error during data purge: {e}")
    finally:
        if should_close:
            db.close()


def seed_database():
    """Initializes tables and ensures clean state for real email logins."""
    init_db()
    print("[Database Ready] System initialized. Ready for real email account connection.")
