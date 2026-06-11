import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.ai_governance.enums.model_enums import ModelProvider, ModelStatus, RiskTier


class AIModelCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    provider: ModelProvider
    model_identifier: str = Field(..., min_length=1, max_length=255)
    version: str = Field(..., min_length=1, max_length=100)
    description: str | None = None
    capabilities: list[str] = Field(default_factory=list)
    risk_tier: RiskTier = RiskTier.MEDIUM
    owner: str | None = None


class AIModelUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    capabilities: list[str] | None = None
    risk_tier: RiskTier | None = None
    owner: str | None = None
    status: ModelStatus | None = None


class AIModelResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    name: str
    provider: ModelProvider
    model_identifier: str
    version: str
    status: ModelStatus
    is_default: bool
    description: str | None
    capabilities: list[Any]
    risk_tier: RiskTier
    owner: str | None
    created_by: str | None
    created_at: datetime
    updated_at: datetime


class AIModelListResponse(BaseModel):
    items: list[AIModelResponse]
    total: int
    limit: int
    offset: int
