import uuid
from datetime import datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import ARRAY, DateTime, Float, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base

_EMBEDDING_DIM = 768


class Recipe(Base):
    __tablename__ = "recipes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    calories: Mapped[int | None] = mapped_column(Integer, nullable=True)
    protein_g: Mapped[float | None] = mapped_column(Float, nullable=True)
    carbs_g: Mapped[float | None] = mapped_column(Float, nullable=True)
    fat_g: Mapped[float | None] = mapped_column(Float, nullable=True)
    fibre_g: Mapped[float | None] = mapped_column(Float, nullable=True)
    sodium_mg: Mapped[float | None] = mapped_column(Float, nullable=True)
    ingredients: Mapped[list[str] | None] = mapped_column(ARRAY(Text), nullable=True)
    diet_tags: Mapped[list[str] | None] = mapped_column(ARRAY(Text), nullable=True)
    cuisine_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    time_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    source_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    embedding_vector: Mapped[list[float] | None] = mapped_column(Vector(_EMBEDDING_DIM), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
