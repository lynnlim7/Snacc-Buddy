import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.ai_governance.api.deps import get_inference_audit_service
from app.ai_governance.schemas.risk_assessment import (
    RiskAssessmentListResponse,
    RiskAssessmentResponse,
)
from app.ai_governance.services.inference_audit import InferenceAuditService

router = APIRouter()


@router.get(
    "/",
    response_model=RiskAssessmentListResponse,
    summary="List risk assessments with pagination",
)
async def list_risk_assessments(
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
    service: InferenceAuditService = Depends(get_inference_audit_service),
) -> RiskAssessmentListResponse:
    items, total = await service.risk_repo.list_paginated(limit=limit, offset=offset)
    return RiskAssessmentListResponse(
        items=[RiskAssessmentResponse.model_validate(r) for r in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/inference/{inference_id}",
    response_model=RiskAssessmentResponse,
    summary="Get risk assessment for a specific inference",
)
async def get_risk_for_inference(
    inference_id: uuid.UUID,
    service: InferenceAuditService = Depends(get_inference_audit_service),
) -> RiskAssessmentResponse:
    risk = await service.risk_repo.get_by_inference_id(inference_id)
    if not risk:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No risk assessment found for inference '{inference_id}'.",
        )
    return RiskAssessmentResponse.model_validate(risk)
