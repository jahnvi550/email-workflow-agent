from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.task import ExtractedTask
from backend.app.models.email import EmailMessage
from backend.app.schemas.task_schemas import TaskCreate, TaskUpdate, TaskRead
from backend.app.tools.task_tool import TaskTool

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.get("", response_model=List[TaskRead])
def list_tasks(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    email_id: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(100, le=200),
    offset: int = 0,
    db: Session = Depends(get_db)
):
    query = db.query(ExtractedTask).order_by(ExtractedTask.created_at.desc())
    if status:
        query = query.filter(ExtractedTask.status == status)
    if priority:
        query = query.filter(ExtractedTask.priority == priority)
    if email_id:
        query = query.filter(ExtractedTask.email_id == email_id)
    if search:
        query = query.filter(
            (ExtractedTask.title.ilike(f"%{search}%")) |
            (ExtractedTask.description.ilike(f"%{search}%"))
        )

    tasks = query.offset(offset).limit(limit).all()
    results = []
    for t in tasks:
        results.append(TaskRead(
            id=t.id,
            email_id=t.email_id,
            title=t.title,
            description=t.description,
            deadline=t.deadline,
            priority=t.priority,
            priority_reason=t.priority_reason,
            status=t.status,
            assignee=t.assignee,
            estimated_hours=t.estimated_hours,
            subtasks=t.subtasks or [],
            tags=t.tags or [],
            created_at=t.created_at,
            updated_at=t.updated_at,
            email_subject=t.email.subject if t.email else None
        ))
    return results


@router.post("", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
def create_task(task_in: TaskCreate, db: Session = Depends(get_db)):
    task = TaskTool.create_task_from_dict(db, task_in.email_id, task_in.model_dump())
    return TaskRead(
        id=task.id,
        email_id=task.email_id,
        title=task.title,
        description=task.description,
        deadline=task.deadline,
        priority=task.priority,
        priority_reason=task.priority_reason,
        status=task.status,
        assignee=task.assignee,
        estimated_hours=task.estimated_hours,
        subtasks=task.subtasks or [],
        tags=task.tags or [],
        created_at=task.created_at,
        updated_at=task.updated_at,
        email_subject=task.email.subject if task.email else None
    )


@router.patch("/{id}", response_model=TaskRead)
def update_task(id: str, task_in: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(ExtractedTask).filter(ExtractedTask.id == id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    update_data = task_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        if val is not None:
            setattr(task, field, val.value if hasattr(val, "value") else val)

    db.commit()
    db.refresh(task)
    return TaskRead(
        id=task.id,
        email_id=task.email_id,
        title=task.title,
        description=task.description,
        deadline=task.deadline,
        priority=task.priority,
        priority_reason=task.priority_reason,
        status=task.status,
        assignee=task.assignee,
        estimated_hours=task.estimated_hours,
        subtasks=task.subtasks or [],
        tags=task.tags or [],
        created_at=task.created_at,
        updated_at=task.updated_at,
        email_subject=task.email.subject if task.email else None
    )



@router.delete("/{id}")
def delete_task(id: str, db: Session = Depends(get_db)):
    task = db.query(ExtractedTask).filter(ExtractedTask.id == id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return {"success": True, "message": "Task deleted"}
