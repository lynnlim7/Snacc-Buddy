import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.ai_governance.enums.model_enums import RiskTier


class RiskAssessmentResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    inference_id: uuid.UUID
    risk_score: int = Field(..., ge=0, le=100)
    risk_level: RiskTier
    reasons: list[Any]
    evaluated_at: datetime


class RiskAssessmentListResponse(BaseModel):
    items: list[RiskAssessmentResponse]
    total: int
    limit: int
    offset: int
