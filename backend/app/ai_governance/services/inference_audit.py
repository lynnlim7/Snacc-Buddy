import hashlib
import json
import logging
import time
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai_governance.enums.inference_enums import InferenceStatus
from app.ai_governance.models.inference_log import AIInferenceLog
from app.ai_governance.models.risk_assessment import RiskAssessment
from app.ai_governance.repositories.inference_log import InferenceLogRepository
from app.ai_governance.repositories.risk_assessment import RiskAssessmentRepository
from app.ai_governance.services.risk_engine.engine import RiskAssessmentEngine

logger = logging.getLogger(__name__)


class InferenceAuditService:
    """
    Central audit gateway for all AI inference calls.

    Contract:
    - ALL AI calls must flow through begin_inference → complete_inference.
    - begin_inference must be called BEFORE the AI provider call, so failures
      and timeouts are captured even if complete_inference is never reached.
    - complete_inference runs risk assessment and persists the full audit record.
    - record_failure marks a pre-opened log as failed without running risk assessment.

    The two-phase design (begin/complete) ensures that a process crash between
    the two calls leaves a detectable orphaned record (response_payload={})
    rather than a missing audit trail.
    """

    def __init__(
        self,
        db: AsyncSession,
        risk_engine: RiskAssessmentEngine | None = None,
    ) -> None:
        self.log_repo = InferenceLogRepository(db)
        self.risk_repo = RiskAssessmentRepository(db)
        self.risk_engine = risk_engine or RiskAssessmentEngine()

    async def begin_inference(
        self,
        model_id: UUID,
        prompt_version_id: UUID,
        request_payload: dict,
    ) -> tuple[UUID, float]:
        """
        Opens an audit record before calling the AI provider.

        Returns:
            (log_id, start_time_monotonic)
            Pass both back to complete_inference or record_failure.
        """
        request_hash = hashlib.sha256(
            json.dumps(request_payload, sort_keys=True, default=str).encode("utf-8")
        ).hexdigest()

        log = AIInferenceLog(
            model_id=model_id,
            prompt_version_id=prompt_version_id,
            request_hash=request_hash,
            request_payload=request_payload,
            response_payload={},
            status=InferenceStatus.SUCCESS,  # optimistic; updated on failure
        )
        created = await self.log_repo.create(log)
        logger.info(
            "inference_audit.begin log_id=%s model_id=%s prompt_ver=%s",
            created.id, model_id, prompt_version_id,
        )
        return created.id, time.monotonic()

    async def complete_inference(
        self,
        log_id: UUID,
        start_time: float,
        response_payload: dict,
        confidence_score: float,
        status: InferenceStatus = InferenceStatus.SUCCESS,
        token_usage: dict | None = None,
        food_log_id: UUID | None = None,
        risk_context: dict | None = None,
    ) -> AIInferenceLog:
        """
        Completes an audit record and runs risk assessment.

        risk_context should include all fields the rule engine needs:
            confidence_score, ambiguity_flags, ingredients,
            restaurant_or_brand, estimated_total_calories
        """
        log = await self.log_repo.get_by_id(log_id)
        if not log:
            raise ValueError(f"Inference log '{log_id}' not found.")

        log.latency_ms = int((time.monotonic() - start_time) * 1000)
        log.response_payload = response_payload
        log.confidence_score = confidence_score
        log.token_usage = token_usage
        log.food_log_id = food_log_id
        log.status = status

        # Build risk context — confidence is always present
        ctx = dict(risk_context or {})
        ctx["confidence_score"] = confidence_score
        evaluation = self.risk_engine.evaluate(ctx)
        log.risk_level = evaluation.risk_level

        updated_log = await self.log_repo.update(log)

        # Persist the full risk assessment record
        risk = RiskAssessment(
            inference_id=log_id,
            risk_score=evaluation.risk_score,
            risk_level=evaluation.risk_level,
            reasons=evaluation.reasons,
        )
        await self.risk_repo.create(risk)

        logger.info(
            "inference_audit.complete log_id=%s latency_ms=%d confidence=%.3f "
            "risk=%s score=%d",
            log_id,
            log.latency_ms,
            confidence_score,
            evaluation.risk_level.value,
            evaluation.risk_score,
        )
        return updated_log

    async def record_failure(
        self,
        log_id: UUID,
        start_time: float,
        status: InferenceStatus,
        error_payload: dict,
    ) -> None:
        """
        Marks a pre-opened inference log as failed.
        Does NOT run risk assessment — failed inferences have no AI output to evaluate.
        """
        log = await self.log_repo.get_by_id(log_id)
        if not log:
            logger.error("inference_audit.record_failure — log_id=%s not found", log_id)
            return
        log.latency_ms = int((time.monotonic() - start_time) * 1000)
        log.status = status
        log.response_payload = error_payload
        await self.log_repo.update(log)
        logger.warning(
            "inference_audit.failure log_id=%s status=%s latency_ms=%d",
            log_id, status.value, log.latency_ms,
        )

    async def link_food_log(self, log_id: UUID, food_log_id: UUID) -> None:
        """Back-fills food_log_id after the food log is persisted."""
        log = await self.log_repo.get_by_id(log_id)
        if log:
            log.food_log_id = food_log_id
            await self.log_repo.update(log)
