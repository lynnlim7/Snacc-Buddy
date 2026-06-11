import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.ai_governance.enums.inference_enums import InferenceStatus
from app.ai_governance.enums.model_enums import RiskTier

if TYPE_CHECKING:
    from app.ai_governance.models.ai_model import AIModel
    from app.ai_governance.models.prompt_version import PromptVersion
    from app.ai_governance.models.risk_assessment import RiskAssessment
    from app.ai_governance.models.human_review import HumanReview


class AIInferenceLog(Base):
    __tablename__ = "ai_inference_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    # Cross-domain FK — nullable so governance records survive food log deletion
    food_log_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("food_logs.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    model_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("ai_models.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    prompt_version_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("prompt_versions.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    # SHA-256 of serialised request payload — enables dedup analytics
    request_hash: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    request_payload: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    response_payload: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    confidence_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    latency_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # {"input_tokens": N, "output_tokens": N, "total_tokens": N}
    token_usage: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    status: Mapped[InferenceStatus] = mapped_column(
        Enum(InferenceStatus, name="inference_status_enum", create_type=False),
        nullable=False,
        default=InferenceStatus.SUCCESS,
    )
    # Denormalised from RiskAssessment for fast dashboard queries (avoids join)
    risk_level: Mapped[RiskTier | None] = mapped_column(
        Enum(RiskTier, name="risk_tier_enum", create_type=False),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    # Relationships
    model: Mapped["AIModel"] = relationship("AIModel", back_populates="inference_logs")
    prompt_version: Mapped["PromptVersion"] = relationship(
        "PromptVersion", back_populates="inference_logs"
    )
    risk_assessment: Mapped["RiskAssessment | None"] = relationship(
        "RiskAssessment", back_populates="inference_log", uselist=False
    )
    human_review: Mapped["HumanReview | None"] = relationship(
        "HumanReview", back_populates="inference_log", uselist=False
    )
