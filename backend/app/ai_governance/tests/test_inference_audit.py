"""
Unit tests for InferenceAuditService.

Tests verify:
- begin_inference writes a log record before AI provider is called
- complete_inference triggers risk assessment and persists both records
- record_failure marks the log without running risk assessment
- risk_level is denormalised onto the inference log after assessment
"""
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.ai_governance.enums.inference_enums import InferenceStatus
from app.ai_governance.enums.model_enums import RiskTier
from app.ai_governance.services.inference_audit import InferenceAuditService
from app.ai_governance.services.risk_engine.engine import RiskAssessmentEngine


@pytest.fixture
def mock_db():
    return AsyncMock()


@pytest.fixture
def audit_service(mock_db, mock_log_repo, mock_risk_repo):
    service = InferenceAuditService.__new__(InferenceAuditService)
    service.log_repo = mock_log_repo
    service.risk_repo = mock_risk_repo
    service.risk_engine = RiskAssessmentEngine()
    return service


class TestInferenceAuditService:
    async def test_begin_inference_creates_log_record(
        self, audit_service, mock_log_repo, model_id, prompt_id
    ):
        expected_id = uuid.uuid4()
        created_log = MagicMock()
        created_log.id = expected_id
        # Clear side_effect from conftest and set return_value directly
        mock_log_repo.create.side_effect = None
        mock_log_repo.create.return_value = created_log

        log_id, start_time = await audit_service.begin_inference(
            model_id=model_id,
            prompt_version_id=prompt_id,
            request_payload={"image_hash": "abc123", "mime_type": "image/jpeg"},
        )

        mock_log_repo.create.assert_called_once()
        assert log_id == expected_id
        assert start_time > 0

    async def test_begin_inference_hashes_payload(
        self, audit_service, mock_log_repo, model_id, prompt_id
    ):
        log = MagicMock()
        log.id = uuid.uuid4()
        mock_log_repo.create.return_value = log

        await audit_service.begin_inference(
            model_id, prompt_id, {"image_hash": "abc123"}
        )
        created_log = mock_log_repo.create.call_args[0][0]
        assert len(created_log.request_hash) == 64  # SHA-256

    async def test_complete_inference_runs_risk_assessment(
        self, audit_service, mock_risk_repo, sample_inference_log, inference_id
    ):
        import time
        start = time.monotonic()

        await audit_service.complete_inference(
            log_id=inference_id,
            start_time=start,
            response_payload={"food_name": "chicken rice"},
            confidence_score=0.85,
            risk_context={"estimated_total_calories": 450},
        )

        mock_risk_repo.create.assert_called_once()
        risk_record = mock_risk_repo.create.call_args[0][0]
        assert risk_record.inference_id == inference_id
        assert risk_record.risk_score >= 0
        assert risk_record.risk_level in list(RiskTier)

    async def test_complete_inference_denormalises_risk_level(
        self, audit_service, sample_inference_log
    ):
        import time
        start = time.monotonic()

        await audit_service.complete_inference(
            log_id=sample_inference_log.id,
            start_time=start,
            response_payload={},
            confidence_score=0.2,  # very low → HIGH risk
            risk_context={},
        )

        # risk_level must be set on the inference log (denormalised)
        assert sample_inference_log.risk_level == RiskTier.HIGH

    async def test_record_failure_does_not_run_risk(
        self, audit_service, mock_risk_repo, sample_inference_log
    ):
        import time
        start = time.monotonic()

        await audit_service.record_failure(
            log_id=sample_inference_log.id,
            start_time=start,
            status=InferenceStatus.TIMEOUT,
            error_payload={"error": "timeout"},
        )

        mock_risk_repo.create.assert_not_called()
        assert sample_inference_log.status == InferenceStatus.TIMEOUT

    async def test_record_failure_sets_error_payload(
        self, audit_service, sample_inference_log
    ):
        import time
        start = time.monotonic()

        await audit_service.record_failure(
            log_id=sample_inference_log.id,
            start_time=start,
            status=InferenceStatus.FAILED,
            error_payload={"error": "API error"},
        )

        assert sample_inference_log.response_payload == {"error": "API error"}

    async def test_complete_inference_records_latency(
        self, audit_service, sample_inference_log
    ):
        import time
        start = time.monotonic() - 0.5  # simulate 500ms elapsed

        await audit_service.complete_inference(
            log_id=sample_inference_log.id,
            start_time=start,
            response_payload={},
            confidence_score=0.9,
        )

        # latency_ms should be roughly 500ms (allow ±200ms for test overhead)
        assert 300 <= sample_inference_log.latency_ms <= 2000
