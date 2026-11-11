"""
Email Sync Background Service.
Continuous polling and zero-touch automatic LangGraph workflow execution.
Supports both database queues and live IMAP server streaming.
"""

import asyncio
from datetime import datetime
from typing import Optional, Dict, Any
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy.orm import Session

from backend.app.database import SessionLocal
from backend.app.models.email import EmailMessage
from backend.app.models.user import User
from backend.app.services.workflow_service import WorkflowService
from backend.app.services.real_email_service import RealEmailService
from backend.app.tools.notification_tool import NotificationTool


class EmailSyncService:
    _scheduler: Optional[AsyncIOScheduler] = None
    _is_running: bool = False
    _sync_interval_seconds: int = 20

    @classmethod
    def get_scheduler(cls) -> AsyncIOScheduler:
        if cls._scheduler is None:
            cls._scheduler = AsyncIOScheduler()
        return cls._scheduler

    @classmethod
    def start(cls, interval_seconds: int = 20):
        """Starts the background continuous email polling worker."""
        scheduler = cls.get_scheduler()
        cls._sync_interval_seconds = interval_seconds
        
        if not cls._is_running:
            try:
                scheduler.add_job(
                    cls._poll_and_process_unread_emails,
                    trigger=IntervalTrigger(seconds=cls._sync_interval_seconds),
                    id="email_auto_ingest_worker",
                    name="Automated Email Ingestion & Workflow Trigger",
                    replace_existing=True,
                    max_instances=1
                )
                scheduler.start()
                cls._is_running = True
                print(f"[EmailSyncService] Continuous background worker started (Polling every {cls._sync_interval_seconds}s).")
            except Exception as e:
                print(f"[EmailSyncService] Startup warning: {e}")

    @classmethod
    def stop(cls):
        """Stops the background scheduler."""
        if cls._scheduler and cls._is_running:
            try:
                cls._scheduler.shutdown(wait=False)
                cls._is_running = False
                print("[EmailSyncService] Background sync worker stopped.")
            except Exception as e:
                print(f"[EmailSyncService] Stop error: {e}")

    @classmethod
    def is_active(cls) -> bool:
        return cls._is_running

    @classmethod
    async def trigger_sync_now(cls) -> Dict[str, Any]:
        """Manually trigger immediate sync run."""
        return await cls._poll_and_process_unread_emails()

    @classmethod
    async def _poll_and_process_unread_emails(cls) -> Dict[str, Any]:
        """
        Background task:
        1. If user has REAL_IMAP configured, fetch new unread live emails from the IMAP server.
        2. Query all UNPROCESSED email messages in database.
        3. Automatically run LangGraph orchestrator for each email.
        4. Update User last_synced_at timestamp.
        """
        db: Session = SessionLocal()
        processed_count = 0
        processed_ids = []

        try:
            user = db.query(User).first()

            # 1. Live IMAP Fetch if user connected real email
            if user and user.provider == "REAL_IMAP" and user.imap_password:
                try:
                    RealEmailService.fetch_and_ingest_live_emails(
                        db=db,
                        email_address=user.email,
                        password=user.imap_password,
                        imap_server=user.imap_server or "imap.gmail.com",
                        imap_port=user.imap_port or 993,
                        limit=3,
                        only_unread=True
                    )
                except Exception as imap_err:
                    print(f"[EmailSyncService] Real IMAP polling note: {imap_err}")

            # 2. Query unprocessed emails from database
            unprocessed_emails = db.query(EmailMessage).filter(
                EmailMessage.status == "UNPROCESSED"
            ).order_by(EmailMessage.received_at.asc()).all()

            if unprocessed_emails:
                print(f"[EmailSyncService] Detected {len(unprocessed_emails)} unprocessed email(s). Commencing automated AI triage...")

                for email in unprocessed_emails:
                    email_id = email.id
                    email_subject = email.subject
                    
                    try:
                        # Auto-execute workflow via LangGraph
                        wf = WorkflowService.execute_workflow(
                            db=db,
                            email_id=email_id,
                            auto_run=True
                        )
                        processed_count += 1
                        processed_ids.append(email_id)
                        print(f"[EmailSyncService] Auto-processed email '{email_subject}' -> Workflow ID: {wf.id} (State: {wf.state})")
                    except Exception as ex:
                        print(f"[EmailSyncService] Error auto-processing email {email_id}: {ex}")

            # 3. Update User last_synced_at
            now = datetime.utcnow()
            if user:
                user.last_synced_at = now
                user.is_sync_active = cls._is_running
                db.commit()

            return {
                "success": True,
                "processed_count": processed_count,
                "processed_ids": processed_ids,
                "timestamp": now.isoformat()
            }

        except Exception as e:
            print(f"[EmailSyncService] Background poll error: {e}")
            return {"success": False, "error": str(e)}
        finally:
            db.close()
