from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.activity_log import ActivityLog

router = APIRouter(tags=["activity"])


@router.get("/api/projects/{project_id}/activity")
async def get_activity_log(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ActivityLog).where(ActivityLog.project_id == project_id)
        .order_by(ActivityLog.created_at.desc())
        .limit(50)
    )
    logs = result.scalars().all()
    return [
        {"id": log.id, "action": log.action, "details": log.details, "created_at": log.created_at}
        for log in logs
    ]
