"""
Authentication & Mailbox Connection Schemas.
Includes real email IMAP parameters and live mailbox sync responses.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    email: str
    full_name: Optional[str] = None
    provider: Optional[str] = "REAL_IMAP"


class RealEmailConnectRequest(BaseModel):
    email: str = Field(..., description="Real email address (e.g. user@gmail.com)")
    password: str = Field(..., description="Email password or Gmail App Password")
    imap_server: str = Field(default="imap.gmail.com", description="IMAP host server")
    imap_port: int = Field(default=993, description="IMAP SSL Port (993)")
    full_name: Optional[str] = None
    fetch_limit: int = Field(default=5, description="Number of recent emails to fetch initially")


class RealEmailConnectResponse(BaseModel):
    success: bool
    message: str
    connected_email: str
    ingested_count: int
    ingested_emails: List[Dict[str, Any]] = []


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    avatar_url: Optional[str] = None
    provider: str
    imap_server: Optional[str] = None
    imap_port: Optional[int] = None
    sync_interval_seconds: int
    is_sync_active: bool
    last_synced_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SyncStatusResponse(BaseModel):
    is_syncing: bool
    last_synced_at: Optional[datetime]
    unprocessed_count: int
    total_emails_count: int
    active_user: Optional[UserResponse] = None
