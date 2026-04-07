from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.experiment import Experiment
from app.models.metric import Metric
from app.models.report import Report
from app.models.citation import Citation
from app.models.file_upload import FileUpload
from app.models.activity_log import ActivityLog
from app.schemas.experiment import (
    ExperimentCreate, ExperimentTemplateCreate, ExperimentResponse,
    MetricResponse, TraceResponse,
)
from app.services.experiment_service import run_experiment_pipeline, TEMPLATE_QUERIES

router = APIRouter(tags=["experiments"])


@router.post("/api/projects/{project_id}/experiments", response_model=ExperimentResponse, status_code=202)
async def start_experiment(
    project_id: UUID,
    data: ExperimentCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Project not found")

    experiment = Experiment(
        project_id=project_id,
        file_upload_id=data.file_upload_id,
        name=data.name or f"Experiment",
        query=data.query,
        status="pending",
    )
    db.add(experiment)
    await db.flush()
    db.add(ActivityLog(project_id=project_id, user_id=current_user.id, action="started_experiment", details={"name": experiment.name, "query": data.query[:100]}))

    exp_id = experiment.id
    file_id = data.file_upload_id

    background_tasks.add_task(run_experiment_pipeline, exp_id, file_id, data.query)

    return experiment


@router.post("/api/projects/{project_id}/experiments/template", response_model=ExperimentResponse, status_code=202)
async def start_from_template(
    project_id: UUID,
    data: ExperimentTemplateCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Project not found")

    query = data.query or TEMPLATE_QUERIES.get(data.template_type, "Analyze the data")

    experiment = Experiment(
        project_id=project_id,
        file_upload_id=data.file_upload_id,
        name=f"{data.template_type.upper()} Analysis",
        query=query,
        template_type=data.template_type,
        status="pending",
    )
    db.add(experiment)
    await db.flush()

    background_tasks.add_task(run_experiment_pipeline, experiment.id, data.file_upload_id, query)

    return experiment


@router.get("/api/projects/{project_id}/experiments", response_model=list[ExperimentResponse])
async def list_experiments(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Experiment).where(Experiment.project_id == project_id)
        .order_by(Experiment.created_at.desc())
    )
    return result.scalars().all()


@router.get("/api/experiments/compare")
async def compare_experiments(
    ids: str = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    exp_ids = [UUID(eid.strip()) for eid in ids.split(",")]
    experiments = []
    metrics_by_exp = {}

    for exp_id in exp_ids:
        result = await db.execute(select(Experiment).where(Experiment.id == exp_id))
        exp = result.scalar_one_or_none()
        if exp:
            experiments.append(exp)
            metric_result = await db.execute(select(Metric).where(Metric.experiment_id == exp_id))
            metrics_by_exp[str(exp_id)] = metric_result.scalars().all()

    return {
        "experiments": [ExperimentResponse.model_validate(e) for e in experiments],
        "metrics": {k: [MetricResponse.model_validate(m) for m in v] for k, v in metrics_by_exp.items()},
    }


@router.get("/api/experiments/{experiment_id}", response_model=ExperimentResponse)
async def get_experiment(
    experiment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Experiment).where(Experiment.id == experiment_id))
    experiment = result.scalar_one_or_none()
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")
    return experiment


@router.get("/api/experiments/{experiment_id}/metrics", response_model=list[MetricResponse])
async def get_metrics(
    experiment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Metric).where(Metric.experiment_id == experiment_id).order_by(Metric.category, Metric.metric_name)
    )
    return result.scalars().all()


@router.get("/api/experiments/{experiment_id}/trace", response_model=TraceResponse)
async def get_trace(
    experiment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Experiment).where(Experiment.id == experiment_id))
    experiment = result.scalar_one_or_none()
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")
    return TraceResponse(experiment_id=experiment.id, agent_trace=experiment.agent_trace)


@router.get("/api/experiments/{experiment_id}/data")
async def get_experiment_data(
    experiment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the raw CSV data for the experiment's file."""
    result = await db.execute(select(Experiment).where(Experiment.id == experiment_id))
    experiment = result.scalar_one_or_none()
    if not experiment or not experiment.file_upload_id:
        return {"columns": [], "rows": [], "dtypes": {}}

    file_result = await db.execute(select(FileUpload).where(FileUpload.id == experiment.file_upload_id))
    file_upload = file_result.scalar_one_or_none()
    if not file_upload or file_upload.file_type != "csv":
        return {"columns": [], "rows": [], "dtypes": {}}

    import pandas as pd
    try:
        df = pd.read_csv(file_upload.file_path)
        return {
            "columns": df.columns.tolist(),
            "rows": df.values.tolist(),
            "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
        }
    except Exception:
        return {"columns": [], "rows": [], "dtypes": {}}


