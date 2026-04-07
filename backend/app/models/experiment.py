import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Experiment(Base):
    __tablename__ = "experiments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    file_upload_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("file_uploads.id", ondelete="SET NULL"))
    name: Mapped[str | None] = mapped_column(String(256))
    query: Mapped[str | None] = mapped_column(Text)
    template_type: Mapped[str | None] = mapped_column(String(64))  # eda, ab_test, survey, correlation
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending, running, completed, failed
    agent_trace: Mapped[dict | None] = mapped_column(JSONB)
    error_message: Mapped[str | None] = mapped_column(Text)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    project = relationship("Project", back_populates="experiments")
    file_upload = relationship("FileUpload", back_populates="experiments")
    metrics = relationship("Metric", back_populates="experiment", cascade="all, delete-orphan")
    report = relationship("Report", back_populates="experiment", uselist=False, cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="experiment", cascade="all, delete-orphan")
