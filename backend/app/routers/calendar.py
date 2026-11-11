from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.calendar_event import CalendarEvent
from backend.app.schemas.calendar_schemas import CalendarEventCreate, CalendarEventRead, CalendarEventUpdate
from backend.app.tools.calendar_tool import CalendarTool

router = APIRouter(prefix="/calendar", tags=["Calendar"])


@router.get("/events", response_model=List[CalendarEventRead])
def list_calendar_events(
    status: Optional[str] = None,
    limit: int = Query(100, le=200),
    offset: int = 0,
    db: Session = Depends(get_db)
):
    query = db.query(CalendarEvent).order_by(CalendarEvent.start_time.asc())
    if status:
        query = query.filter(CalendarEvent.status == status)
    events = query.offset(offset).limit(limit).all()
    results = []
    for e in events:
        results.append(CalendarEventRead(
            id=e.id,
            email_id=e.email_id,
            title=e.title,
            description=e.description,
            start_time=e.start_time,
            end_time=e.end_time,
            attendees=e.attendees or [],
            meeting_link=e.meeting_link,
            location=e.location,
            status=e.status,
            created_at=e.created_at,
            updated_at=e.updated_at,
            email_subject=e.email.subject if e.email else None
        ))
    return results


@router.post("/events", response_model=CalendarEventRead, status_code=status.HTTP_201_CREATED)
def create_calendar_event(event_in: CalendarEventCreate, db: Session = Depends(get_db)):
    event = CalendarTool.schedule_meeting(db, event_in.email_id, event_in.model_dump())
    return CalendarEventRead(
        id=event.id,
        email_id=event.email_id,
        title=event.title,
        description=event.description,
        start_time=event.start_time,
        end_time=event.end_time,
        attendees=event.attendees or [],
        meeting_link=event.meeting_link,
        location=event.location,
        status=event.status,
        created_at=event.created_at,
        updated_at=event.updated_at,
        email_subject=event.email.subject if event.email else None
    )


@router.patch("/events/{id}", response_model=CalendarEventRead)
def update_calendar_event(id: str, event_in: CalendarEventUpdate, db: Session = Depends(get_db)):
    event = db.query(CalendarEvent).filter(CalendarEvent.id == id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Calendar event not found")
    
    update_data = event_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        if val is not None:
            setattr(event, field, val)

    db.commit()
    db.refresh(event)
    return CalendarEventRead(
        id=event.id,
        email_id=event.email_id,
        title=event.title,
        description=event.description,
        start_time=event.start_time,
        end_time=event.end_time,
        attendees=event.attendees or [],
        meeting_link=event.meeting_link,
        location=event.location,
        status=event.status,
        created_at=event.created_at,
        updated_at=event.updated_at,
        email_subject=event.email.subject if event.email else None
    )


@router.delete("/events/{id}")
def delete_calendar_event(id: str, db: Session = Depends(get_db)):
    event = db.query(CalendarEvent).filter(CalendarEvent.id == id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Calendar event not found")
    db.delete(event)
    db.commit()
    return {"success": True, "message": "Event deleted"}
