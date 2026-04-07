from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class FileUploadResponse(BaseModel):
    id: UUID
    project_id: UUID
    filename: str
    file_type: str
    file_size_bytes: int | None
    row_count: int | None
    column_names: list[str] | None
    uploaded_at: datetime

    model_config = {"from_attributes": True}


class FilePreviewResponse(BaseModel):
    file_type: str
    filename: str
    columns: list[str] | None = None
    rows: list[list] | None = None
    dtypes: dict | None = None
    text: str | None = None
    page_count: int | None = None
