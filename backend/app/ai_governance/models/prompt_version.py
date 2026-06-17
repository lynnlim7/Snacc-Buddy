import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.ai_governance.enums.prompt_enums import PromptStatus

if TYPE_CHECKING:
    from app.ai_governance.models.ai_model import AIModel
    from app.ai_governance.models.inference_log import AIInferenceLog


class PromptVersion(Base):
    __tablename__ = "prompt_versions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    model_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("ai_models.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    prompt_template: Mapped[str] = mapped_column(Text, nullable=False)
    # SHA-256 hex digest of prompt_template — immutability proof
    content_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[PromptStatus] = mapped_column(
        Enum(PromptStatus, name="prompt_status_enum", create_type=False, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=PromptStatus.DRAFT,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_by: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    model: Mapped["AIModel"] = relationship("AIModel", back_populates="prompt_versions")
    inference_logs: Mapped[list["AIInferenceLog"]] = relationship(
        "AIInferenceLog", back_populates="prompt_version", lazy="select"
    )
