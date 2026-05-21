from fastapi_users.db import SQLAlchemyBaseUserTableUUID
from sqlalchemy import Boolean, Float, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class User(SQLAlchemyBaseUserTableUUID, Base):
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    gender: Mapped[str | None] = mapped_column(String(20), nullable=True)
    age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    height_cm: Mapped[float | None] = mapped_column(Float, nullable=True)
    current_weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    goal_weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    goal: Mapped[str | None] = mapped_column(String(50), nullable=True)
    mindset: Mapped[str | None] = mapped_column(String(50), nullable=True)
    pace: Mapped[str | None] = mapped_column(String(20), nullable=True)
    lifestyle: Mapped[str | None] = mapped_column(String(50), nullable=True)
    has_dietary_restrictions: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    dietary: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    conditions: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    custom_condition: Mapped[str | None] = mapped_column(Text, nullable=True)