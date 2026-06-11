import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel

from app.ai_governance.enums.inference_enums import InferenceStatus
from app.ai_governance.enums.model_enums import RiskTier


class InferenceLogResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    food_log_id: uuid.UUID | None
    model_id: uuid.UUID
    prompt_version_id: uuid.UUID
    request_hash: str | None
    request_payload: dict[str, Any]
    response_payload: dict[str, Any]
    confidence_score: float | None
    latency_ms: int | None
    token_usage: dict[str, Any] | None
    status: InferenceStatus
    risk_level: RiskTier | None
    created_at: datetime


class InferenceLogListResponse(BaseModel):
    items: list[InferenceLogResponse]
    total: int
    limit: int
    offset: int
