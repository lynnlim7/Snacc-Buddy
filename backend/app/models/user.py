from datetime import datetime
from enum import Enum 

from fastapi_users.db import SQLAlchemyBaseUserTableUUID
from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func 

from app.core.database import Base
class User(SQLAlchemyBaseUserTableUUID, Base):
    __tablename__ = "users"
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    gender: Mapped[str | None] = mapped_column(String(20), nullable=True)
    age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    height_cm: Mapped[float | None] = mapped_column(Float, nullable=True)
    current_weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    goal_weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    goal: Mapped[str | None] = mapped_column(String(50), nullable=True)
    lifestyle: Mapped[str | None] = mapped_column(String(50), nullable=True)
    dietary_restrictions: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    medical_conditions: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    condition_type: Mapped[str | None] = mapped_column(Text, nullable=True)
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