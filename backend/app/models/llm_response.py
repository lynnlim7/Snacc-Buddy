from datetime import datetime

from sqlalchemy import BigInteger, DateTime, Integer, SmallInteger, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class LLMResponse(Base):
    __tablename__ = "llm_responses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    # FK to query_session.id — add ForeignKey once that table exists
    query_session_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    trigger_time: Mapped[int] = mapped_column(BigInteger, nullable=False, index=True)

    raw_response: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    parsed_response: Mapped[dict] = mapped_column(JSONB, nullable=False)
    token_usage: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    validflag: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=1)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
