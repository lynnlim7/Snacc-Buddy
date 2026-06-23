import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base


class UserNutritionSummary(Base):
    __tablename__ = "user_nutrition_summary"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    snapshot_date: Mapped[date] = mapped_column(Date, nullable=False)

    # 7-day rolling averages (per-day average, not totals)
    avg_calories_7d: Mapped[float | None] = mapped_column(Float, nullable=True)
    avg_protein_g_7d: Mapped[float | None] = mapped_column(Float, nullable=True)
    avg_carbs_g_7d: Mapped[float | None] = mapped_column(Float, nullable=True)
    avg_fat_g_7d: Mapped[float | None] = mapped_column(Float, nullable=True)
    avg_fibre_g_7d: Mapped[float | None] = mapped_column(Float, nullable=True)
    avg_sodium_g_7d: Mapped[float | None] = mapped_column(Float, nullable=True)

    # 30-day rolling averages
    avg_calories_30d: Mapped[float | None] = mapped_column(Float, nullable=True)
    avg_protein_g_30d: Mapped[float | None] = mapped_column(Float, nullable=True)
    avg_carbs_g_30d: Mapped[float | None] = mapped_column(Float, nullable=True)
    avg_fat_g_30d: Mapped[float | None] = mapped_column(Float, nullable=True)
    avg_fibre_g_30d: Mapped[float | None] = mapped_column(Float, nullable=True)
    avg_sodium_g_30d: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Logging consistency — fraction of last 7 days that had at least one log
    logging_frequency_7d: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Computed targets (from Mifflin-St Jeor + BMI adjustment, same as frontend)
    calorie_target: Mapped[float | None] = mapped_column(Float, nullable=True)
    protein_target_g: Mapped[float | None] = mapped_column(Float, nullable=True)
    carbs_target_g: Mapped[float | None] = mapped_column(Float, nullable=True)
    fat_target_g: Mapped[float | None] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
