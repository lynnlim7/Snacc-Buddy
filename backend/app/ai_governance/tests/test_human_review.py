"""
Unit tests for HumanReviewService.

Key assertions:
- ReviewDecision enum correctly maps to float valid_flag values
- Duplicate review guard raises ReviewAlreadyExistsError
- Inference not found guard raises InferenceLogNotFoundError
- valid_flag float values enable correct rate calculations
"""
import uuid
from unittest.mock import MagicMock

import pytest

from app.ai_governance.enums.review_enums import ReviewDecision
from app.ai_governance.exceptions.governance_exceptions import (
    InferenceLogNotFoundError,
    InvalidReviewDecisionError,
    ReviewAlreadyExistsError,
)
from app.ai_governance.schemas.human_review import HumanReviewCreate
from app.ai_governance.services.human_review import HumanReviewService


@pytest.fixture
def service(mock_review_repo, mock_log_repo):
    return HumanReviewService(mock_review_repo, mock_log_repo)


def _make_create(decision: str, inference_id=None) -> HumanReviewCreate:
    return HumanReviewCreate(
        inference_id=inference_id or uuid.uuid4(),
        original_food_name="chicken rice",
        original_calories=450,
        decision=decision,
    )


class TestReviewDecisionEnum:
    def test_approved_value_is_zero(self):
        assert ReviewDecision.APPROVED.value == 0.0

    def test_review_required_value_is_half(self):
        assert ReviewDecision.REVIEW_REQUIRED.value == 0.5

    def test_rejected_value_is_one(self):
        assert ReviewDecision.REJECTED.value == 1.0

    def test_from_float_round_trips(self):
        for decision in ReviewDecision:
            assert ReviewDecision.from_float(decision.value) == decision

    def test_from_str_case_insensitive(self):
        assert ReviewDecision.from_str("approved") == ReviewDecision.APPROVED
        assert ReviewDecision.from_str("REJECTED") == ReviewDecision.REJECTED

    def test_from_float_invalid_raises(self):
        with pytest.raises(ValueError):
            ReviewDecision.from_float(0.99)


class TestHumanReviewService:
    async def test_approved_stores_float_zero(self, service, mock_review_repo):
        await service.submit_review(_make_create("APPROVED"), reviewer_id="r1")
        created = mock_review_repo.create.call_args[0][0]
        assert created.valid_flag == 0.0

    async def test_review_required_stores_float_half(self, service, mock_review_repo):
        await service.submit_review(_make_create("REVIEW_REQUIRED"), reviewer_id="r1")
        created = mock_review_repo.create.call_args[0][0]
        assert created.valid_flag == 0.5

    async def test_rejected_stores_float_one(self, service, mock_review_repo):
        await service.submit_review(_make_create("REJECTED"), reviewer_id="r1")
        created = mock_review_repo.create.call_args[0][0]
        assert created.valid_flag == 1.0

    async def test_reviewer_id_persisted(self, service, mock_review_repo):
        await service.submit_review(_make_create("APPROVED"), reviewer_id="reviewer_42")
        created = mock_review_repo.create.call_args[0][0]
        assert created.reviewer_id == "reviewer_42"

    async def test_duplicate_review_raises(self, service, mock_review_repo, sample_inference_log):
        mock_review_repo.get_by_inference_id.return_value = MagicMock()
        with pytest.raises(ReviewAlreadyExistsError):
            await service.submit_review(
                _make_create("APPROVED", inference_id=sample_inference_log.id),
                reviewer_id="r1",
            )

    async def test_inference_not_found_raises(self, service, mock_log_repo):
        mock_log_repo.get_by_id.return_value = None
        with pytest.raises(InferenceLogNotFoundError):
            await service.submit_review(_make_create("APPROVED"), reviewer_id="r1")

    async def test_invalid_decision_raises(self, service):
        with pytest.raises(Exception):  # Pydantic validation or InvalidReviewDecisionError
            await service.submit_review(_make_create("MAYBE"), reviewer_id="r1")

    async def test_approval_rate_calculation_principle(self, service, mock_review_repo):
        """
        Demonstrates the valid_flag float design:
        AVG(valid_flag) on a mix of approved/rejected gives a meaningful signal.

        0.0 + 0.0 + 1.0 + 0.5 = 1.5 / 4 = 0.375
        Closer to 0 → mostly approved; closer to 1 → mostly rejected.
        """
        flags = [
            ReviewDecision.APPROVED.value,    # 0.0
            ReviewDecision.APPROVED.value,    # 0.0
            ReviewDecision.REJECTED.value,    # 1.0
            ReviewDecision.REVIEW_REQUIRED.value,  # 0.5
        ]
        avg = sum(flags) / len(flags)
        assert avg == pytest.approx(0.375)
        # Approval count = sum(1 for f in flags if f == 0.0)
        approval_count = sum(1 for f in flags if f == ReviewDecision.APPROVED.value)
        assert approval_count == 2
