import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.ai_governance.enums.prompt_enums import PromptStatus


class PromptVersionCreate(BaseModel):
    model_id: uuid.UUID
    name: str = Field(..., min_length=1, max_length=255)
    prompt_template: str = Field(..., min_length=1)
    description: str | None = None


class PromptVersionResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    model_id: uuid.UUID
    version: int
    name: str
    prompt_template: str
    content_hash: str
    description: str | None
    status: PromptStatus
    is_active: bool
    created_by: str | None
    created_at: datetime
    updated_at: datetime


class PromptVersionListResponse(BaseModel):
    items: list[PromptVersionResponse]
    total: int
    limit: int
    offset: int
