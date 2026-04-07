from uuid import UUID

import io
import json
import zipfile

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.file_upload import FileUpload
from app.models.experiment import Experiment
from app.models.metric import Metric
from app.models.report import Report
from app.models.activity_log import ActivityLog
from app.models.file_upload import FileUpload
from app.models.experiment import Experiment
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse, ProjectListResponse

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    data: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = Project(
        user_id=current_user.id,
        name=data.name,
        description=data.description,
        tags=data.tags or [],
    )
    db.add(project)
    await db.flush()
    db.add(ActivityLog(project_id=project.id, user_id=current_user.id, action="created_project", details={"name": data.name}))
    return ProjectResponse(
        id=project.id, user_id=project.user_id, name=project.name,
        description=project.description, tags=project.tags,
        created_at=project.created_at, updated_at=project.updated_at,
    )


@router.get("", response_model=ProjectListResponse)
async def list_projects(
    tag: str | None = Query(None),
    search: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Project).where(Project.user_id == current_user.id)
    if tag:
        query = query.where(Project.tags.contains([tag]))
    if search:
        query = query.where(Project.name.ilike(f"%{search}%"))
    query = query.order_by(Project.updated_at.desc())

    result = await db.execute(query)
    projects = result.scalars().all()

    project_responses = []
    for p in projects:
        file_count_result = await db.execute(
            select(func.count()).select_from(FileUpload).where(FileUpload.project_id == p.id)
        )
        exp_count_result = await db.execute(
            select(func.count()).select_from(Experiment).where(Experiment.project_id == p.id)
        )
        project_responses.append(ProjectResponse(
            id=p.id, user_id=p.user_id, name=p.name,
            description=p.description, tags=p.tags,
            created_at=p.created_at, updated_at=p.updated_at,
            file_count=file_count_result.scalar() or 0,
            experiment_count=exp_count_result.scalar() or 0,
        ))

    return ProjectListResponse(projects=project_responses, total=len(project_responses))


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    file_count_result = await db.execute(
        select(func.count()).select_from(FileUpload).where(FileUpload.project_id == project.id)
    )
    exp_count_result = await db.execute(
        select(func.count()).select_from(Experiment).where(Experiment.project_id == project.id)
    )
    return ProjectResponse(
        id=project.id, user_id=project.user_id, name=project.name,
        description=project.description, tags=project.tags,
        created_at=project.created_at, updated_at=project.updated_at,
        file_count=file_count_result.scalar() or 0,
        experiment_count=exp_count_result.scalar() or 0,
    )


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: UUID,
    data: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if data.name is not None:
        project.name = data.name
    if data.description is not None:
        project.description = data.description
    if data.tags is not None:
        project.tags = data.tags
    await db.flush()

    return ProjectResponse(
        id=project.id, user_id=project.user_id, name=project.name,
        description=project.description, tags=project.tags,
        created_at=project.created_at, updated_at=project.updated_at,
    )


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    await db.delete(project)


@router.get("/{project_id}/export")
async def export_project(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        # Project info
        zf.writestr("project.json", json.dumps({
            "name": project.name, "description": project.description, "tags": project.tags,
        }, indent=2))

        # Files
        files_result = await db.execute(select(FileUpload).where(FileUpload.project_id == project_id))
        for f in files_result.scalars().all():
            import os
            if os.path.exists(f.file_path):
                zf.write(f.file_path, f"files/{f.filename}")

        # Experiments + metrics + reports
        exps_result = await db.execute(select(Experiment).where(Experiment.project_id == project_id))
        for exp in exps_result.scalars().all():
            exp_dir = f"experiments/{exp.name or str(exp.id)[:8]}"
            zf.writestr(f"{exp_dir}/experiment.json", json.dumps({
                "name": exp.name, "query": exp.query, "status": exp.status,
                "template_type": exp.template_type,
            }, indent=2))

            metrics_result = await db.execute(select(Metric).where(Metric.experiment_id == exp.id))
            metrics_data = [{"metric_name": m.metric_name, "column_name": m.column_name, "category": m.category, "value": m.metric_value} for m in metrics_result.scalars().all()]
            zf.writestr(f"{exp_dir}/metrics.json", json.dumps(metrics_data, indent=2))

            report_result = await db.execute(select(Report).where(Report.experiment_id == exp.id))
            report = report_result.scalar_one_or_none()
            if report:
                zf.writestr(f"{exp_dir}/report.md", report.content_markdown)

    buf.seek(0)
    return StreamingResponse(
        buf, media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=atlas-{project.name.replace(' ', '_')}.zip"},
    )
