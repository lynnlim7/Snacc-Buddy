import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base


class NutritionInsight(Base):
    __tablename__ = "nutrition_insights"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    summary_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user_nutrition_summary.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Deterministic rule outputs — no AI, no audit row
    protein_deficit: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    fibre_deficit: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    excess_sodium: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    calorie_surplus: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    weight_loss_stalled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    low_meal_consistency: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Adherence percentages (0.0–1.0+)
    protein_adherence_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    calorie_adherence_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    fibre_adherence_pct: Mapped[float | None] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
