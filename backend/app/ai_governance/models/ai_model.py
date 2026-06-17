import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Enum, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.ai_governance.enums.model_enums import ModelProvider, ModelStatus, RiskTier

if TYPE_CHECKING:
    from app.ai_governance.models.prompt_version import PromptVersion
    from app.ai_governance.models.inference_log import AIInferenceLog


class AIModel(Base):
    __tablename__ = "ai_models"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    provider: Mapped[ModelProvider] = mapped_column(
        Enum(ModelProvider, name="model_provider_enum", create_type=False, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    model_identifier: Mapped[str] = mapped_column(String(255), nullable=False)
    version: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[ModelStatus] = mapped_column(
        Enum(ModelStatus, name="model_status_enum", create_type=False, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=ModelStatus.ACTIVE,
    )
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    # ["vision", "nutrition_analysis", "ocr"]
    capabilities: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    risk_tier: Mapped[RiskTier] = mapped_column(
        Enum(RiskTier, name="risk_tier_enum", create_type=False, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=RiskTier.MEDIUM,
    )
    owner: Mapped[str | None] = mapped_column(String(255), nullable=True)
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
    prompt_versions: Mapped[list["PromptVersion"]] = relationship(
        "PromptVersion", back_populates="model", lazy="select"
    )
    inference_logs: Mapped[list["AIInferenceLog"]] = relationship(
        "AIInferenceLog", back_populates="model", lazy="select"
    )
