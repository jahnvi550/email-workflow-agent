from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field


class EmailCreate(BaseModel):
    sender: str
    recipient: Optional[str] = "user@organization.com"
    subject: str
    body: str
    received_at: Optional[datetime] = None
    priority: Optional[str] = "MEDIUM"
    category: Optional[str] = "General Inquiry"


class EmailUpdate(BaseModel):
    is_starred: Optional[bool] = None
    is_archived: Optional[bool] = None
    priority: Optional[str] = None
    category: Optional[str] = None


class EmailSimulateRequest(BaseModel):
    preset_id: Optional[str] = None
    custom_subject: Optional[str] = None
    custom_body: Optional[str] = None
    custom_sender: Optional[str] = None
    auto_process: bool = True


class EmailRawImportRequest(BaseModel):
    raw_content: str
    sender: Optional[str] = None
    subject: Optional[str] = None
    recipient: Optional[str] = None
    auto_process: bool = True



class EmailRead(BaseModel):
    id: str
    sender: str
    recipient: str
    subject: str
    body: str
    received_at: datetime
    status: str
    priority: str
    category: str
    is_starred: bool
    is_archived: bool
    thread_id: Optional[str] = None
    tasks_count: Optional[int] = 0
    workflows_count: Optional[int] = 0
    calendar_events_count: Optional[int] = 0

    class Config:
        from_attributes = True
