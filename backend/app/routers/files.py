import os
import uuid as uuid_mod
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.file_upload import FileUpload
from app.schemas.file_upload import FileUploadResponse, FilePreviewResponse
from app.models.activity_log import ActivityLog
from app.utils.file_parsers import parse_csv, parse_pdf, get_csv_preview

router = APIRouter(tags=["files"])

ALLOWED_TYPES = {"csv": "text/csv", "pdf": "application/pdf"}


@router.post("/api/projects/{project_id}/files", response_model=FileUploadResponse, status_code=201)
async def upload_file(
    project_id: UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ("csv", "pdf"):
        raise HTTPException(status_code=400, detail="Only CSV and PDF files are supported")

    upload_dir = os.path.join(settings.UPLOAD_DIR, str(project_id))
    os.makedirs(upload_dir, exist_ok=True)

    unique_name = f"{uuid_mod.uuid4()}_{file.filename}"
    file_path = os.path.join(upload_dir, unique_name)

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    row_count = None
    column_names = None

    if ext == "csv":
        try:
            parsed = parse_csv(file_path)
            row_count = parsed["row_count"]
            column_names = parsed["columns"]
        except Exception:
            pass

    file_upload = FileUpload(
        project_id=project_id,
        filename=file.filename,
        file_type=ext,
        file_path=file_path,
        file_size_bytes=len(content),
        row_count=row_count,
        column_names=column_names,
    )
    db.add(file_upload)
    await db.flush()
    db.add(ActivityLog(project_id=project_id, user_id=current_user.id, action="uploaded_file", details={"filename": file.filename, "type": ext}))

    return file_upload


@router.get("/api/projects/{project_id}/files", response_model=list[FileUploadResponse])
async def list_files(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Project not found")

    result = await db.execute(
        select(FileUpload).where(FileUpload.project_id == project_id).order_by(FileUpload.uploaded_at.desc())
    )
    return result.scalars().all()


@router.get("/api/files/{file_id}/preview", response_model=FilePreviewResponse)
async def preview_file(
    file_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(FileUpload).where(FileUpload.id == file_id))
    file_upload = result.scalar_one_or_none()
    if not file_upload:
        raise HTTPException(status_code=404, detail="File not found")

    if file_upload.file_type == "csv":
        preview = get_csv_preview(file_upload.file_path)
        return FilePreviewResponse(
            file_type="csv", filename=file_upload.filename,
            columns=preview["columns"], rows=preview["rows"], dtypes=preview["dtypes"],
        )
    elif file_upload.file_type == "pdf":
        parsed = parse_pdf(file_upload.file_path)
        return FilePreviewResponse(
            file_type="pdf", filename=file_upload.filename,
            text=parsed["preview"], page_count=parsed["page_count"],
        )
    raise HTTPException(status_code=400, detail="Unsupported file type")


@router.delete("/api/files/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(
    file_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(FileUpload).where(FileUpload.id == file_id))
    file_upload = result.scalar_one_or_none()
    if not file_upload:
        raise HTTPException(status_code=404, detail="File not found")

    if os.path.exists(file_upload.file_path):
        os.remove(file_upload.file_path)

    await db.delete(file_upload)
