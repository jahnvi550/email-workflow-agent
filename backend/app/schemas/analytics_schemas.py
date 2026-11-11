from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class MetricCard(BaseModel):
    title: str
    value: str | int | float
    subtitle: str
    change_percent: Optional[float] = None
    trend: Optional[str] = "up"  # up, down, neutral


class ChartDataPoint(BaseModel):
    name: str
    value: int | float
    color: Optional[str] = None


class TimeSavedMetrics(BaseModel):
    total_hours_saved: float
    hours_saved_today: float
    triage_time_reduction_percent: float
    automated_tasks_count: int
    automated_meetings_count: int
    draft_replies_count: int


class AnalyticsSummaryResponse(BaseModel):
    metrics: Dict[str, MetricCard]
    time_saved: TimeSavedMetrics
    category_distribution: List[ChartDataPoint]
    priority_distribution: List[ChartDataPoint]
    workflow_status_distribution: List[ChartDataPoint]
    recent_activity_logs: List[Dict[str, Any]]
