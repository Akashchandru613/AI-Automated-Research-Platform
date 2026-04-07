from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.bookmark import Bookmark

router = APIRouter(prefix="/api/bookmarks", tags=["bookmarks"])


class BookmarkCreate(BaseModel):
    experiment_id: UUID
    metric_name: str | None = None
    note: str | None = None


@router.post("", status_code=201)
async def create_bookmark(
    data: BookmarkCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    bookmark = Bookmark(
        user_id=current_user.id,
        experiment_id=data.experiment_id,
        metric_name=data.metric_name,
        note=data.note,
    )
    db.add(bookmark)
    await db.flush()
    return {"id": bookmark.id, "experiment_id": bookmark.experiment_id, "metric_name": bookmark.metric_name, "note": bookmark.note}


@router.get("")
async def list_bookmarks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Bookmark).where(Bookmark.user_id == current_user.id).order_by(Bookmark.created_at.desc())
    )
    bookmarks = result.scalars().all()
    return [
        {"id": b.id, "experiment_id": b.experiment_id, "metric_name": b.metric_name, "note": b.note, "created_at": b.created_at}
        for b in bookmarks
    ]


@router.delete("/{bookmark_id}", status_code=204)
async def delete_bookmark(
    bookmark_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Bookmark).where(Bookmark.id == bookmark_id, Bookmark.user_id == current_user.id)
    )
    bookmark = result.scalar_one_or_none()
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    await db.delete(bookmark)
