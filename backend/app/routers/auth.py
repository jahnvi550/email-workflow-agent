"""
Authentication & Real Mailbox Connection Endpoints.
Zero fake demo profiles. Connects exclusively to live real IMAP mailboxes (Gmail, Outlook, Yahoo, Custom).
"""

from typing import Optional
from datetime import datetime
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.email import EmailMessage
from backend.app.schemas.auth_schemas import (
    LoginRequest, 
    RealEmailConnectRequest, 
    RealEmailConnectResponse,
    UserResponse, 
    SyncStatusResponse
)
from backend.app.services.email_sync_service import EmailSyncService
from backend.app.services.real_email_service import RealEmailService

router = APIRouter(prefix="/auth", tags=["Authentication & Mailbox Connection"])


@router.post("/connect-real-email", response_model=RealEmailConnectResponse)
def connect_real_email_mailbox(payload: RealEmailConnectRequest, db: Session = Depends(get_db)):
    """
    Connects to a real live IMAP email account (e.g. Gmail with App Password, Outlook, etc.).
    1. Verifies live IMAP login credentials.
    2. Updates or creates the active User in database with real IMAP parameters.
    3. Immediately fetches and parses the latest emails from the inbox.
    4. Triggers the LangGraph agent for each fetched email and saves all actions for backend review.
    """
    email_addr = payload.email.strip().lower()
    password = payload.password.strip()
    server = payload.imap_server.strip()
    port = payload.imap_port

    # 1. Test live IMAP connectivity
    test_result = RealEmailService.test_connection(
        email_address=email_addr,
        password=password,
        imap_server=server,
        imap_port=port
    )

    if not test_result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=test_result.get("message", "Failed to connect to email server. Please verify your email and password/App Password.")
        )

    # 2. Update or create real user
    user = db.query(User).filter(User.email == email_addr).first()
    display_name = payload.full_name or email_addr.split('@')[0].capitalize()
    
    if not user:
        user = User(
            email=email_addr,
            full_name=display_name,
            avatar_url=None,
            provider="REAL_IMAP",
            imap_server=server,
            imap_port=port,
            imap_password=password,
            is_sync_active=True,
            last_synced_at=datetime.utcnow()
        )
        db.add(user)
    else:
        user.full_name = display_name
        user.provider = "REAL_IMAP"
        user.imap_server = server
        user.imap_port = port
        user.imap_password = password
        user.is_sync_active = True
        user.last_synced_at = datetime.utcnow()

    db.commit()
    db.refresh(user)

    # 3. Fetch latest live emails and run LangGraph orchestrator
    try:
        ingested = RealEmailService.fetch_and_ingest_live_emails(
            db=db,
            email_address=email_addr,
            password=password,
            imap_server=server,
            imap_port=port,
            limit=payload.fetch_limit,
            only_unread=False
        )
    except Exception as fetch_err:
        print(f"[Auth] Warning fetching live emails: {fetch_err}")
        ingested = []

    # 4. Ensure background sync worker is running
    if not EmailSyncService.is_active():
        EmailSyncService.start(interval_seconds=30)

    return RealEmailConnectResponse(
        success=True,
        message=f"Connected to {email_addr}. Ingested {len(ingested)} real email(s) and dispatched to LangGraph.",
        connected_email=email_addr,
        ingested_count=len(ingested),
        ingested_emails=ingested
    )


@router.post("/test-imap")
def test_imap_credentials(payload: RealEmailConnectRequest):
    """Tests live IMAP login without saving or fetching full email content."""
    res = RealEmailService.test_connection(
        email_address=payload.email,
        password=payload.password,
        imap_server=payload.imap_server,
        imap_port=payload.imap_port
    )
    if not res.get("success"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=res.get("message"))
    return res


@router.get("/me", response_model=Optional[UserResponse])
def get_current_user(db: Session = Depends(get_db)):
    """Retrieves the active real user account if one has logged in."""
    user = db.query(User).first()
    return user


@router.get("/sync-status", response_model=SyncStatusResponse)
def get_mailbox_sync_status(db: Session = Depends(get_db)):
    """Returns current continuous mailbox sync state."""
    user = db.query(User).first()
    unprocessed_count = db.query(EmailMessage).filter(EmailMessage.status == "UNPROCESSED").count()
    total_emails = db.query(EmailMessage).count()

    return SyncStatusResponse(
        is_syncing=EmailSyncService.is_active() and (user is not None),
        last_synced_at=user.last_synced_at if user else None,
        unprocessed_count=unprocessed_count,
        total_emails_count=total_emails,
        active_user=user
    )


@router.post("/trigger-sync")
async def trigger_manual_mailbox_sync():
    """Manually triggers an immediate background polling pass."""
    result = await EmailSyncService.trigger_sync_now()
    return result


@router.post("/toggle-sync")
def toggle_mailbox_background_sync(db: Session = Depends(get_db)):
    """Toggles continuous background email polling worker on or off."""
    user = db.query(User).first()
    if EmailSyncService.is_active():
        EmailSyncService.stop()
        if user:
            user.is_sync_active = False
            db.commit()
        return {"is_syncing": False, "message": "Background sync worker paused."}
    else:
        interval = user.sync_interval_seconds if user else 30
        EmailSyncService.start(interval_seconds=interval)
        if user:
            user.is_sync_active = True
            db.commit()
        return {"is_syncing": True, "message": f"Background sync worker started ({interval}s interval)."}


@router.post("/disconnect")
def disconnect_real_mailbox(db: Session = Depends(get_db)):
    """Disconnects real mailbox account and clears active session."""
    user = db.query(User).first()
    if user:
        db.delete(user)
        db.commit()
    EmailSyncService.stop()
    return {"success": True, "message": "Mailbox disconnected successfully."}
