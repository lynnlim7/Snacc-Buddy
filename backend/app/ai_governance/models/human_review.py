import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.ai_governance.models.inference_log import AIInferenceLog


class HumanReview(Base):
    __tablename__ = "human_reviews"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    inference_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("ai_inference_logs.id", ondelete="RESTRICT"),
        nullable=False,
        unique=True,   # one review per inference
        index=True,
    )
    reviewer_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    original_food_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    corrected_food_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    original_calories: Mapped[int | None] = mapped_column(Integer, nullable=True)
    corrected_calories: Mapped[int | None] = mapped_column(Integer, nullable=True)
    review_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    # ReviewDecision stored as float:
    #   0.0 = APPROVED
    #   0.5 = REVIEW_REQUIRED
    #   1.0 = REJECTED
    # Enables SQL aggregations: AVG, SUM, approval/rejection rate calculations.
    valid_flag: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    # Relationships
    inference_log: Mapped["AIInferenceLog"] = relationship(
        "AIInferenceLog", back_populates="human_review"
    )
