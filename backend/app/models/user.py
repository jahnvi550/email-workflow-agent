"""
User model representing authenticated mailbox accounts, IMAP parameters, and synchronization state.
"""

from datetime import datetime
import uuid
from sqlalchemy import Column, String, DateTime, Boolean, Integer
from backend.app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False, default="Workspace Lead")
    avatar_url = Column(String(500), nullable=True)
    provider = Column(String(50), default="GOOGLE_WORKSPACE")  # GOOGLE_WORKSPACE, MICROSOFT_365, REAL_IMAP
    
    # Real IMAP connection settings
    imap_server = Column(String(255), nullable=True, default="imap.gmail.com")
    imap_port = Column(Integer, nullable=True, default=993)
    imap_password = Column(String(255), nullable=True)
    
    sync_interval_seconds = Column(Integer, default=30)
    is_sync_active = Column(Boolean, default=True)
    last_synced_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
