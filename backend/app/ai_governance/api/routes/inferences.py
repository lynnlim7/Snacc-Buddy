import uuid
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.ai_governance.api.deps import get_inference_audit_service
from app.ai_governance.enums.model_enums import RiskTier
from app.ai_governance.schemas.inference_log import (
    InferenceLogListResponse,
    InferenceLogResponse,
)
from app.ai_governance.services.inference_audit import InferenceAuditService

router = APIRouter()


@router.get(
    "/",
    response_model=InferenceLogListResponse,
    summary="List inference logs with filters",
)
async def list_inferences(
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
    model_id: uuid.UUID | None = None,
    risk_level: RiskTier | None = None,
    since: datetime | None = None,
    service: InferenceAuditService = Depends(get_inference_audit_service),
) -> InferenceLogListResponse:
    items, total = await service.log_repo.get_recent(
        model_id=model_id,
        risk_level=risk_level,
        since=since,
        limit=limit,
        offset=offset,
    )
    return InferenceLogListResponse(
        items=[InferenceLogResponse.model_validate(i) for i in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/{log_id}",
    response_model=InferenceLogResponse,
    summary="Get a specific inference log",
)
async def get_inference(
    log_id: uuid.UUID,
    service: InferenceAuditService = Depends(get_inference_audit_service),
) -> InferenceLogResponse:
    log = await service.log_repo.get_by_id(log_id)
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inference log '{log_id}' not found.",
        )
    return InferenceLogResponse.model_validate(log)
