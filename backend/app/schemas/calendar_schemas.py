from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class CalendarEventCreate(BaseModel):
    email_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    attendees: Optional[List[str]] = []
    meeting_link: Optional[str] = None
    location: Optional[str] = "Google Meet"
    status: Optional[str] = "CONFIRMED"


class CalendarEventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    attendees: Optional[List[str]] = None
    meeting_link: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None


class CalendarEventRead(BaseModel):
    id: str
    email_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    attendees: List[str]
    meeting_link: Optional[str] = None
    location: str
    status: str
    created_at: datetime
    updated_at: datetime
    email_subject: Optional[str] = None

    class Config:
        from_attributes = True
