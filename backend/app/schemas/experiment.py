from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ExperimentCreate(BaseModel):
    file_upload_id: UUID | None = None
    name: str | None = None
    query: str


class ExperimentTemplateCreate(BaseModel):
    file_upload_id: UUID | None = None
    template_type: str  # eda, ab_test, survey, correlation
    query: str | None = None


class ExperimentResponse(BaseModel):
    id: UUID
    project_id: UUID
    file_upload_id: UUID | None
    name: str | None
    query: str | None
    template_type: str | None
    status: str
    error_message: str | None
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class MetricResponse(BaseModel):
    id: UUID
    experiment_id: UUID
    metric_name: str
    metric_value: dict
    column_name: str | None
    category: str | None

    model_config = {"from_attributes": True}


class TraceResponse(BaseModel):
    experiment_id: UUID
    agent_trace: list[dict] | None


class CompareResponse(BaseModel):
    experiments: list[ExperimentResponse]
    metrics: dict  # {experiment_id: [MetricResponse]}
