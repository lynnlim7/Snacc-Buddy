import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.ai_governance.enums.model_enums import RiskTier

if TYPE_CHECKING:
    from app.ai_governance.models.inference_log import AIInferenceLog


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    inference_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("ai_inference_logs.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,   # one assessment per inference, enforced at DB level
        index=True,
    )
    risk_score: Mapped[int] = mapped_column(Integer, nullable=False)  # 0–100
    risk_level: Mapped[RiskTier] = mapped_column(
        Enum(RiskTier, name="risk_tier_enum", create_type=False),
        nullable=False,
        index=True,
    )
    # [{"rule": "confidence_rule", "score_contribution": 40, "reason": "..."}]
    reasons: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    evaluated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    inference_log: Mapped["AIInferenceLog"] = relationship(
        "AIInferenceLog", back_populates="risk_assessment"
    )
