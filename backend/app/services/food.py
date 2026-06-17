import hashlib
import logging
from datetime import date
from uuid import UUID

from app.prompt.gemini import gemini_service
from app.repositories.food import FoodRepository
from app.schemas.food import (
    FoodLogConfirm,
    FoodLogCreate,
    FoodLogResponse,
    FoodLogUpdate,
    GeminiAnalysis,
)
from app.services.cache import get_cached_analysis, set_cached_analysis
from app.ai_governance.enums.inference_enums import InferenceStatus
from app.ai_governance.services.inference_audit import InferenceAuditService
from app.core.exceptions import AIException, AITimeoutError, AIParseError

logger = logging.getLogger(__name__)


class FoodService:
    def __init__(self, repo: FoodRepository) -> None:
        self.repo = repo

    async def analyze_image(
        self,
        image_bytes: bytes,
        mime_type: str,
        audit_service: InferenceAuditService,
        model_id: UUID,
        prompt_version_id: UUID,
    ) -> tuple[GeminiAnalysis, UUID]:
        """
        Analyzes a food image and writes a full governance audit record.

        Returns:
            (GeminiAnalysis, inference_log_id)

        The inference_log_id is passed back to confirm_log so the FoodLog
        can be linked to its audit record after persistence.

        Cache-hit path:
            Still writes an audit record with status=CACHE_HIT so the
            full inference history is preserved regardless of caching.
        """
        image_hash = hashlib.sha256(image_bytes).hexdigest()
        request_payload = {"image_hash": image_hash, "mime_type": mime_type}

        log_id, start = await audit_service.begin_inference(
            model_id=model_id,
            prompt_version_id=prompt_version_id,
            request_payload=request_payload,
        )

        cached = await get_cached_analysis(image_hash)
        if cached:
            await audit_service.complete_inference(
                log_id=log_id,
                start_time=start,
                response_payload=cached.model_dump(),
                confidence_score=cached.overall_confidence,
                status=InferenceStatus.CACHE_HIT,
                risk_context=_build_risk_context(cached),
            )
            logger.info("food_service.analyze cache_hit image_hash=%s", image_hash[:8])
            return cached, log_id

        try:
            analysis = await gemini_service.analyze_food_image(image_bytes, mime_type)
            await set_cached_analysis(image_hash, analysis)
            await audit_service.complete_inference(
                log_id=log_id,
                start_time=start,
                response_payload=analysis.model_dump(),
                confidence_score=analysis.overall_confidence,
                status=InferenceStatus.SUCCESS,
                risk_context=_build_risk_context(analysis),
            )
            return analysis, log_id

        except AITimeoutError as e:
            logger.warning("food_service.analyze timeout log_id=%s", log_id)
            await audit_service.record_failure(
                log_id, start, InferenceStatus.TIMEOUT, {"error": str(e)}
            )
            raise
        except AIParseError as e:
            logger.warning("food_service.analyze parse_error log_id=%s error=%s", log_id, e)
            await audit_service.record_failure(
                log_id, start, InferenceStatus.PARSE_ERROR, {"error": str(e)}
            )
            raise
        except AIException as e:
            logger.error(
                "food_service.analyze ai_error log_id=%s type=%s error=%s",
                log_id, type(e).__name__, e,
            )
            await audit_service.record_failure(
                log_id, start, InferenceStatus.FAILED, {"error": str(e)}
            )
            raise

    async def confirm_log(
        self,
        user_id: str,
        payload: FoodLogConfirm,
    ) -> FoodLogResponse:
        log_data = FoodLogCreate(
            user_id=user_id,
            meal_type=payload.meal_type,
            image_urls=payload.image_urls,
            analysis=payload.analysis,
            inference_log_id=payload.inference_log_id,
        )
        return await self.repo.create(log_data)

    async def get_logs(
        self, user_id: str, limit: int, offset: int, target_date: "date | None" = None
    ) -> tuple[list[FoodLogResponse], int]:
        if target_date is not None:
            items = await self.repo.get_by_user_for_date(user_id, target_date)
            return items, len(items)
        return await self.repo.get_by_user(user_id, limit, offset)

    async def get_log(self, log_id: str, user_id: str) -> FoodLogResponse | None:
        return await self.repo.get_by_id(log_id, user_id)

    async def update_log(
        self, log_id: str, user_id: str, data: FoodLogUpdate
    ) -> FoodLogResponse | None:
        return await self.repo.update(log_id, user_id, data)

    async def delete_log(self, log_id: str, user_id: str) -> bool:
        return await self.repo.delete(log_id, user_id)


def _build_risk_context(analysis: GeminiAnalysis) -> dict:
    """Extracts risk-engine context fields from a GeminiAnalysis object."""
    return {
        "confidence_score": analysis.overall_confidence,
        "ambiguity_flags": analysis.ambiguity_flags,
        "ingredients": [i.model_dump() for i in analysis.ingredients],
        "restaurant_or_brand": analysis.restaurant_or_brand,
        "estimated_total_calories": analysis.estimated_total_calories,
    }
