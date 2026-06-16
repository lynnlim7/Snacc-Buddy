import logging

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi_limiter.depends import RateLimiter
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import current_active_user
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.prompt.gemini import gemini_service
from app.schemas.food import FoodChatRequest, GeminiAnalysis
from app.ai_governance.api.deps import get_inference_audit_service
from app.ai_governance.enums.inference_enums import InferenceStatus
from app.ai_governance.repositories.model_registry import ModelRegistryRepository
from app.ai_governance.repositories.prompt_registry import PromptRegistryRepository
from app.ai_governance.services.inference_audit import InferenceAuditService

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post(
    "/chat",
    response_model=GeminiAnalysis,
    dependencies=[
        Depends(
            RateLimiter(
                times=settings.AI_RATE_LIMIT_REQUESTS,
                seconds=settings.AI_RATE_LIMIT_WINDOW_SECONDS,
            )
        )
    ],
)
async def refine_food_analysis(
    payload: FoodChatRequest,
    user: User = Depends(current_active_user),
    audit_service: InferenceAuditService = Depends(get_inference_audit_service),
    db: AsyncSession = Depends(get_db),
) -> GeminiAnalysis:
    logger.info("refine_food_analysis user=%s messages=%d", user.id, len(payload.messages))

    model_repo = ModelRegistryRepository(db)
    prompt_repo = PromptRegistryRepository(db)

    default_model = await model_repo.get_default_model()
    if not default_model:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "No default AI model is configured. "
                "Register and activate a model via /api/v1/governance/models."
            ),
        )

    active_prompt = await prompt_repo.get_active_prompt_for_model(default_model.id)
    if not active_prompt:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "No active prompt is configured for the default model. "
                "Activate a prompt version via /api/v1/governance/prompts."
            ),
        )

    messages = [{"role": m.role, "content": m.content} for m in payload.messages]
    log_id, start = await audit_service.begin_inference(
        model_id=default_model.id,
        prompt_version_id=active_prompt.id,
        request_payload={
            "prior_analysis": payload.prior_analysis.model_dump(),
            "messages": messages,
        },
    )

    try:
        analysis = await gemini_service.refine_analysis(payload.prior_analysis, messages)
    except Exception:
        await audit_service.record_failure(
            log_id, start, InferenceStatus.FAILED, {"error": "refinement_failed"}
        )
        raise

    await audit_service.complete_inference(
        log_id=log_id,
        start_time=start,
        response_payload=analysis.model_dump(),
        confidence_score=analysis.overall_confidence,
        status=InferenceStatus.SUCCESS,
        risk_context={
            "ambiguity_flags": analysis.ambiguity_flags,
            "ingredients": [i.model_dump() for i in analysis.ingredients],
            "restaurant_or_brand": analysis.restaurant_or_brand,
            "estimated_total_calories": analysis.estimated_total_calories,
        },
    )

    return analysis
