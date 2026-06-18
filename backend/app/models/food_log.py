import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base

"""
One meal upload action
"""
class FoodLog(Base):
    __tablename__ = "food_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    meal_type: Mapped[str] = mapped_column(String(50), nullable=False)
    meal_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    serving_size: Mapped[str | None] = mapped_column(String(100))
    preparation_method:  Mapped[str | None] = mapped_column(String(100))
    ingredients: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    estimated_total_calories: Mapped[int] = mapped_column(Integer, nullable=False)
    protein_g: Mapped[float | None] = mapped_column(Float, nullable=True)
    carbs_g: Mapped[float | None] = mapped_column(Float, nullable=True)
    fat_g: Mapped[float | None] = mapped_column(Float, nullable=True)
    fibre_g: Mapped[float | None] = mapped_column(Float, nullable=True)
    sugar_g: Mapped[float | None] = mapped_column(Float, nullable=True)
    sodium_g: Mapped[float | None] = mapped_column(Float, nullable=True)
    visible_sauces_or_oils: Mapped[bool] = mapped_column(default=False)
    cuisine_type: Mapped[str | None] = mapped_column(String(100))
    restaurant_or_brand: Mapped[str | None] = mapped_column(String(252))
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    ambiguity_flags: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    mood: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    raw_response: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    image_url: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    # Governance cross-domain link — nullable; SET NULL if inference log is ever purged
    inference_log_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("ai_inference_logs.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
