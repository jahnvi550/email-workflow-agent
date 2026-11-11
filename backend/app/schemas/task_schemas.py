from datetime import datetime
from typing import Optional, List
from enum import Enum
from pydantic import BaseModel


class TaskStatusEnum(str, Enum):
    TODO = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    UNDER_REVIEW = "UNDER_REVIEW"
    COMPLETED = "COMPLETED"


class TaskPriorityEnum(str, Enum):
    URGENT = "URGENT"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class TaskCreate(BaseModel):
    email_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    priority: Optional[TaskPriorityEnum] = TaskPriorityEnum.MEDIUM
    priority_reason: Optional[str] = None
    status: Optional[TaskStatusEnum] = TaskStatusEnum.TODO
    assignee: Optional[str] = "AI Agent"
    estimated_hours: Optional[str] = None
    subtasks: Optional[List[dict]] = []
    tags: Optional[List[str]] = []


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    priority: Optional[TaskPriorityEnum] = None
    priority_reason: Optional[str] = None
    status: Optional[TaskStatusEnum] = None
    assignee: Optional[str] = None
    estimated_hours: Optional[str] = None
    subtasks: Optional[List[dict]] = None
    tags: Optional[List[str]] = None


class TaskRead(BaseModel):
    id: str
    email_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    priority: str
    priority_reason: Optional[str] = None
    status: str
    assignee: str
    estimated_hours: Optional[str] = None
    subtasks: Optional[List[dict]] = []
    tags: List[str]
    created_at: datetime
    updated_at: datetime
    email_subject: Optional[str] = None

    class Config:
        from_attributes = True

