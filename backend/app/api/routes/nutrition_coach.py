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
from app.nutrition_coach.repositories.nutrition_summary import NutritionSummaryRepository
from app.nutrition_coach.services.orchestrator import NutritionCoachOrchestrator
from app.nutrition_coach.services.recommendation import RecommendationAgent
from app.repositories.food import FoodRepository
from app.schemas.coach import (
    CoachChatRequest,
    CoachChatResponse,
    CoachInsightResponse,
)

router = APIRouter()
logger = logging.getLogger(__name__)

_RECENT_MEAL_LIMIT = 10


async def _build_user_context(db: AsyncSession, user: User) -> dict:
    """Profile + today's totals + recent meals — real-time ground truth for the coach."""
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


async def _resolve_governance(db: AsyncSession):
    model_repo = ModelRegistryRepository(db)
    prompt_repo = PromptRegistryRepository(db)
    default_model = await model_repo.get_default_model()
    if not default_model:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No default AI model configured. Register one via /api/v1/governance/models.",
        )
    active_prompt = await prompt_repo.get_active_prompt_for_model(default_model.id)
    if not active_prompt:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No active prompt configured for the default model.",
        )
    return default_model, active_prompt


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
    """Stage-2 coaching chat — grounded in Stage-1 persisted outputs when available.

    On first use (no Stage-1 data yet) the route falls back to basic profile + recent
    meals context. Stage-1 data enriches every chat call once the user has logged meals.
    """
    logger.info("coach_chat user=%s messages=%d", user.id, len(payload.messages))

    default_model, active_prompt = await _resolve_governance(db)
    user_context = await _build_user_context(db, user)

    # Load Stage-1 persisted outputs (graceful fallback if none exist yet)
    orchestrator = NutritionCoachOrchestrator(db)
    snapshot, insight, top10 = await orchestrator.load_stage1(str(user.id))

    log_id, start = await audit_service.begin_inference(
        model_id=default_model.id,
        prompt_version_id=active_prompt.id,
        request_payload={
            "messages": [{"role": m.role, "content": m.content} for m in payload.messages],
            "has_snapshot": snapshot is not None,
            "has_insight": insight is not None,
        },
    )

    try:
        agent = RecommendationAgent()
        result = await agent.recommend(
            snapshot=snapshot,
            insight=insight,
            top10=top10,
            messages=payload.messages,
            user_context=user_context,
        )
    except Exception:
        await audit_service.record_failure(
            log_id, start, InferenceStatus.FAILED, {"error": "coach_chat_failed"}
        )
        raise

    await audit_service.complete_inference(
        log_id=log_id,
        start_time=start,
        response_payload=result.model_dump(mode="json"),
        confidence_score=0.9 if result.in_scope else 0.5,
        status=InferenceStatus.SUCCESS,
        risk_context={
            "in_scope": result.in_scope,
            "recipe_count": len(result.recipes),
        },
    )

    result.inference_log_id = log_id
    return result


@router.post(
    "/analyze",
    response_model=dict,
    dependencies=[
        Depends(
            RateLimiter(
                times=settings.AI_RATE_LIMIT_REQUESTS,
                seconds=settings.AI_RATE_LIMIT_WINDOW_SECONDS,
            )
        )
    ],
)
async def run_full_analysis(
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """On-demand trigger for Stage-1 orchestration (memory + insight + retrieval).

    Useful on first app open or after a long gap without logging. Stage-1 normally
    runs automatically on every meal log via FoodService.confirm_log.
    """
    orchestrator = NutritionCoachOrchestrator(db)
    snapshot, insight, top10 = await orchestrator.prepare(user)
    return {
        "snapshot_id": str(snapshot.id),
        "snapshot_date": snapshot.snapshot_date.isoformat(),
        "insights": {
            "protein_deficit": insight.protein_deficit,
            "fibre_deficit": insight.fibre_deficit,
            "excess_sodium": insight.excess_sodium,
            "calorie_surplus": insight.calorie_surplus,
            "low_meal_consistency": insight.low_meal_consistency,
        },
        "recipes_retrieved": len(top10),
    }


@router.get("/insights", response_model=CoachInsightResponse)
async def get_insights(
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_db),
) -> CoachInsightResponse:
    """Return the latest computed nutrition insights for the current user.

    These are deterministic (no AI) — updated automatically on every meal log.
    Returns a 404 if no insights have been computed yet (no meals logged).
    """
    repo = NutritionSummaryRepository(db)
    insight = await repo.get_latest_insight(str(user.id))
    if not insight:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No insights available yet. Log a meal to generate your first insights.",
        )
    summary = await repo.get_latest_summary(str(user.id))
    return CoachInsightResponse(
        protein_deficit=insight.protein_deficit,
        fibre_deficit=insight.fibre_deficit,
        excess_sodium=insight.excess_sodium,
        calorie_surplus=insight.calorie_surplus,
        low_meal_consistency=insight.low_meal_consistency,
        protein_adherence_pct=insight.protein_adherence_pct,
        calorie_adherence_pct=insight.calorie_adherence_pct,
        fibre_adherence_pct=insight.fibre_adherence_pct,
        avg_calories_7d=summary.avg_calories_7d if summary else None,
        calorie_target=summary.calorie_target if summary else None,
        computed_at=insight.created_at.isoformat(),
    )
