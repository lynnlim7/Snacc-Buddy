import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.ai_governance.api.deps import get_human_review_service
from app.ai_governance.exceptions.governance_exceptions import (
    InferenceLogNotFoundError,
    InvalidReviewDecisionError,
    ReviewAlreadyExistsError,
)
from app.ai_governance.schemas.human_review import (
    HumanReviewCreate,
    HumanReviewListResponse,
    HumanReviewResponse,
)
from app.ai_governance.schemas.inference_log import InferenceLogListResponse, InferenceLogResponse
from app.ai_governance.services.human_review import HumanReviewService
from app.core.auth import current_active_user
from app.models.user import User

router = APIRouter()


@router.get(
    "/pending",
    response_model=InferenceLogListResponse,
    summary="Get HIGH-risk inferences awaiting human review",
)
async def get_pending_reviews(
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
    service: HumanReviewService = Depends(get_human_review_service),
) -> InferenceLogListResponse:
    items, total = await service.get_pending_reviews(limit=limit, offset=offset)
    return InferenceLogListResponse(
        items=[InferenceLogResponse.model_validate(i) for i in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post(
    "/",
    response_model=HumanReviewResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a human review for an inference",
)
async def submit_review(
    data: HumanReviewCreate,
    user: User = Depends(current_active_user),
    service: HumanReviewService = Depends(get_human_review_service),
) -> HumanReviewResponse:
    try:
        review = await service.submit_review(data, reviewer_id=str(user.id))
        return HumanReviewResponse.from_orm_with_decision(review)
    except InferenceLogNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ReviewAlreadyExistsError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except InvalidReviewDecisionError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))


@router.get(
    "/",
    response_model=HumanReviewListResponse,
    summary="List all human reviews",
)
async def list_reviews(
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
    service: HumanReviewService = Depends(get_human_review_service),
) -> HumanReviewListResponse:
    items, total = await service.list_reviews(limit=limit, offset=offset)
    return HumanReviewListResponse(
        items=[HumanReviewResponse.from_orm_with_decision(r) for r in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/{review_id}",
    response_model=HumanReviewResponse,
    summary="Get a specific human review",
)
async def get_review(
    review_id: uuid.UUID,
    service: HumanReviewService = Depends(get_human_review_service),
) -> HumanReviewResponse:
    review = await service.get_review(review_id)
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Review '{review_id}' not found.",
        )
    return HumanReviewResponse.from_orm_with_decision(review)


@router.get(
    "/inference/{inference_id}",
    response_model=HumanReviewResponse,
    summary="Get the review for a specific inference",
)
async def get_review_by_inference(
    inference_id: uuid.UUID,
    service: HumanReviewService = Depends(get_human_review_service),
) -> HumanReviewResponse:
    review = await service.get_review_by_inference(inference_id)
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No review found for inference '{inference_id}'.",
        )
    return HumanReviewResponse.from_orm_with_decision(review)
