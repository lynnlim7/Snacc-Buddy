import logging
from uuid import UUID

from app.ai_governance.enums.review_enums import ReviewDecision
from app.ai_governance.exceptions.governance_exceptions import (
    InferenceLogNotFoundError,
    InvalidReviewDecisionError,
    ReviewAlreadyExistsError,
)
from app.ai_governance.models.human_review import HumanReview
from app.ai_governance.repositories.human_review import HumanReviewRepository
from app.ai_governance.repositories.inference_log import InferenceLogRepository
from app.ai_governance.schemas.human_review import HumanReviewCreate

logger = logging.getLogger(__name__)


class HumanReviewService:
    def __init__(
        self,
        review_repo: HumanReviewRepository,
        log_repo: InferenceLogRepository,
    ) -> None:
        self.review_repo = review_repo
        self.log_repo = log_repo

    async def submit_review(
        self,
        data: HumanReviewCreate,
        reviewer_id: str,
    ) -> HumanReview:
        """
        Submit a human review for an inference log.

        Business rules:
        - The inference log must exist.
        - Only one review per inference (idempotency guard).
        - Decision is validated against ReviewDecision enum.
        - valid_flag is stored as a float for SQL aggregation.
        """
        log = await self.log_repo.get_by_id(data.inference_id)
        if not log:
            raise InferenceLogNotFoundError(data.inference_id)

        existing = await self.review_repo.get_by_inference_id(data.inference_id)
        if existing:
            raise ReviewAlreadyExistsError(data.inference_id)

        try:
            decision = ReviewDecision.from_str(data.decision)
        except KeyError:
            raise InvalidReviewDecisionError(data.decision)

        review = HumanReview(
            inference_id=data.inference_id,
            reviewer_id=reviewer_id,
            original_food_name=data.original_food_name,
            corrected_food_name=data.corrected_food_name,
            original_calories=data.original_calories,
            corrected_calories=data.corrected_calories,
            review_notes=data.review_notes,
            valid_flag=decision.value,
        )
        result = await self.review_repo.create(review)
        logger.info(
            "human_review.submitted id=%s inference_id=%s reviewer=%s decision=%s valid_flag=%.1f",
            result.id, data.inference_id, reviewer_id, data.decision, decision.value,
        )
        return result

    async def get_pending_reviews(
        self, limit: int = 20, offset: int = 0
    ) -> tuple[list, int]:
        """Returns HIGH-risk inference logs that have no human review yet."""
        return await self.review_repo.get_unreviewed_high_risk(limit, offset)

    async def get_review(self, review_id: UUID) -> HumanReview | None:
        return await self.review_repo.get_by_id(review_id)

    async def get_review_by_inference(self, inference_id: UUID) -> HumanReview | None:
        return await self.review_repo.get_by_inference_id(inference_id)

    async def list_reviews(
        self, limit: int = 20, offset: int = 0
    ) -> tuple[list[HumanReview], int]:
        return await self.review_repo.list_paginated(limit=limit, offset=offset)
