import json
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.experiment import Experiment
from app.models.metric import Metric
from app.models.chat_message import ChatMessage

router = APIRouter(tags=["chat"])


class ChatRequest(BaseModel):
    message: str


@router.post("/api/experiments/{experiment_id}/chat")
async def send_chat_message(
    experiment_id: UUID,
    data: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Experiment).where(Experiment.id == experiment_id))
    experiment = result.scalar_one_or_none()
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")

    # Save user message
    user_msg = ChatMessage(experiment_id=experiment_id, role="user", content=data.message)
    db.add(user_msg)
    await db.flush()

    # Get context
    metrics_result = await db.execute(select(Metric).where(Metric.experiment_id == experiment_id))
    metrics = metrics_result.scalars().all()

    columns = []
    analysis_summary = ""
    for m in metrics:
        if m.column_name and m.column_name not in columns:
            columns.append(m.column_name)
        if m.metric_name == "mean":
            analysis_summary += f"{m.column_name}: mean={m.metric_value.get('value')}, "

    # Get chat history
    history_result = await db.execute(
        select(ChatMessage).where(ChatMessage.experiment_id == experiment_id)
        .order_by(ChatMessage.created_at)
    )
    history = [{"role": msg.role, "content": msg.content} for msg in history_result.scalars().all()]

    # Get AI response (lazy import to avoid slow startup)
    from app.agents.chat_agent import get_chat_response
    response_text = get_chat_response(
        user_query=experiment.query or "",
        columns=columns,
        analysis_summary=analysis_summary[:1000],
        chat_history=history[:-1],  # exclude the message we just added
        current_message=data.message,
    )

    # Save assistant message
    assistant_msg = ChatMessage(experiment_id=experiment_id, role="assistant", content=response_text)
    db.add(assistant_msg)
    await db.flush()

    return {"role": "assistant", "content": response_text, "id": str(assistant_msg.id)}


@router.get("/api/experiments/{experiment_id}/chat/history")
async def get_chat_history(
    experiment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ChatMessage).where(ChatMessage.experiment_id == experiment_id)
        .order_by(ChatMessage.created_at)
    )
    messages = result.scalars().all()
    return [{"id": str(m.id), "role": m.role, "content": m.content, "created_at": m.created_at} for m in messages]
