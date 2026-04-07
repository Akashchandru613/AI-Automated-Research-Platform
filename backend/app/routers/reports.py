from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.report import Report
from app.models.citation import Citation
from app.models.experiment import Experiment

router = APIRouter(tags=["reports"])


@router.get("/api/experiments/{experiment_id}/report")
async def get_report(
    experiment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Report).where(Report.experiment_id == experiment_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return {
        "id": report.id,
        "experiment_id": report.experiment_id,
        "title": report.title,
        "content_markdown": report.content_markdown,
        "summary": report.summary,
        "generated_at": report.generated_at,
    }


@router.get("/api/experiments/{experiment_id}/citations")
async def get_citations(
    experiment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report_result = await db.execute(select(Report).where(Report.experiment_id == experiment_id))
    report = report_result.scalar_one_or_none()
    if not report:
        return []

    result = await db.execute(select(Citation).where(Citation.report_id == report.id))
    citations = result.scalars().all()
    return [
        {
            "id": c.id,
            "paper_title": c.paper_title,
            "authors": c.authors,
            "year": c.year,
            "doi": c.doi,
            "url": c.url,
            "relevance_score": c.relevance_score,
            "relationship_type": c.relationship_type,
        }
        for c in citations
    ]
