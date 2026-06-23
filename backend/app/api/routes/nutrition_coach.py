import logging
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi_limiter.depends import RateLimiter
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai_governance.api.deps import get_inference_audit_service
from app.ai_governance.enums.inference_enums import InferenceStatus
from app.ai_governance.repositories.model_registry import ModelRegistryRepository
from app.ai_governance.repositories.prompt_registry import PromptRegistryRepository
from app.ai_governance.services.inference_audit import InferenceAuditService
from app.core.auth import current_active_user
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.prompt.gemini import gemini_service
from app.repositories.food import FoodRepository
from app.schemas.coach import CoachChatRequest, CoachChatResponse

router = APIRouter()
logger = logging.getLogger(__name__)

# How much recent history the coach reasons over.
_RECENT_MEAL_LIMIT = 10


async def _build_user_context(db: AsyncSession, user: User) -> dict:
    """Assemble the ground-truth context the coach reasons over.

    Pulls the user's profile, today's running totals, and recent meals — the
    "existing information" the coach grounds its advice in. (When the Nutrition
    Memory Layer lands this is where the 7/30/90-day summary plugs in.)
    """
    food_repo = FoodRepository(db)
    user_id = str(user.id)

    recent_logs, _ = await food_repo.get_by_user(user_id, limit=_RECENT_MEAL_LIMIT, offset=0)
    today = await food_repo.get_daily_summary(user_id, date.today())

    return {
        "profile": {
            "name": user.name,
            "gender": user.gender,
            "age": user.age,
            "height_cm": user.height_cm,
            "current_weight_kg": user.current_weight_kg,
            "goal_weight_kg": user.goal_weight_kg,
            "goal": user.goal,
            "lifestyle": user.lifestyle,
            "has_dietary_restrictions": user.dietary_restrictions,
            "has_conditions": user.medical_conditions,
            "condition_type": user.condition_type,
        },
        "today": today,
        "recent_meals": [
            {
                "meal_type": log.meal_type,
                "meal_name": log.meal_name,
                "calories": log.estimated_total_calories,
                "protein_g": log.protein_g,
                "carbs_g": log.carbs_g,
                "fat_g": log.fat_g,
                "logged_at": log.created_at.isoformat(),
            }
            for log in recent_logs
        ],
    }


@router.post(
    "/chat",
    response_model=CoachChatResponse,
    dependencies=[
        Depends(
            RateLimiter(
                times=settings.AI_RATE_LIMIT_REQUESTS,
                seconds=settings.AI_RATE_LIMIT_WINDOW_SECONDS,
            )
        )
    ],
)
async def coach_chat(
    payload: CoachChatRequest,
    user: User = Depends(current_active_user),
    audit_service: InferenceAuditService = Depends(get_inference_audit_service),
    db: AsyncSession = Depends(get_db),
) -> CoachChatResponse:
    """Stateless nutrition-coach chat.

    The client sends the full conversation; the coach answers the latest user
    turn grounded in that user's profile + logged meals. Every call is recorded
    through the governance audit envelope (model/prompt version, confidence,
    risk). Scope + medical guardrails are enforced by the coach system prompt.
    """
    logger.info("coach_chat user=%s messages=%d", user.id, len(payload.messages))

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

    user_context = await _build_user_context(db, user)
    messages = [{"role": m.role, "content": m.content} for m in payload.messages]

    log_id, start = await audit_service.begin_inference(
        model_id=default_model.id,
        prompt_version_id=active_prompt.id,
        request_payload={
            "messages": messages,
            "context_keys": sorted(user_context.keys()),
        },
    )

    try:
        result = await gemini_service.coach_chat(user_context, messages)
    except Exception:
        await audit_service.record_failure(
            log_id, start, InferenceStatus.FAILED, {"error": "coach_chat_failed"}
        )
        raise

    await audit_service.complete_inference(
        log_id=log_id,
        start_time=start,
        response_payload=result.model_dump(mode="json"),
        # In-scope answers are treated as high-confidence; out-of-scope redirects
        # are flagged lower so they surface in governance review queries.
        confidence_score=0.9 if result.in_scope else 0.5,
        status=InferenceStatus.SUCCESS,
        risk_context={
            "in_scope": result.in_scope,
            "recipe_count": len(result.recipes),
        },
    )

    result.inference_log_id = log_id
    return result
