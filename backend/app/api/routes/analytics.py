import logging
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.analytics.analytics_service import AnalyticsService
from app.core.auth import current_active_user
from app.core.database import get_db
from app.models.user import User
from app.repositories.food import FoodRepository
from app.schemas.analytics import DailySummaryResponse, NutritionTargetsResponse, WeeklySummaryResponse

router = APIRouter()
logger = logging.getLogger(__name__)


def get_analytics_service(db: AsyncSession = Depends(get_db)) -> AnalyticsService:
    return AnalyticsService(FoodRepository(db))


@router.get("/daily", response_model=DailySummaryResponse)
async def get_daily_summary(
    target_date: date = Query(default_factory=date.today),
    user: User = Depends(current_active_user),
    service: AnalyticsService = Depends(get_analytics_service),
):
    logger.info(
        "daily analytics summary requested user=%s date=%s",
        user.id,
        target_date,
    )
    summary = await service.get_daily_summary(
        user_id=str(user.id),
        target_date=target_date,
    )
    logger.info(
        "daily analytics summary completed "
        "user=%s date=%s meal_count=%s total_calories=%s",
        user.id,
        target_date,
        summary.meal_count,
        summary.total_calories,
    )
    return summary


def _bmi_calorie_adjustment(weight_kg: float, height_cm: float) -> int:
    """Return the calorie adjustment (kcal) for a given BMI.

    Mirrors the logic in frontend/utils/nutrition.ts so the backend
    and frontend always produce identical targets.
    """
    height_m = height_cm / 100
    bmi = weight_kg / (height_m ** 2)
    if bmi < 16:
        return 700    # severely underweight
    if bmi < 18.5:
        return 400    # underweight
    if bmi < 25:
        return 0      # normal — maintenance
    if bmi < 30:
        return -400   # overweight
    if bmi < 35:
        return -600   # obese
    return -750       # severely obese


@router.get("/targets", response_model=NutritionTargetsResponse)
async def get_nutrition_targets(
    user: User = Depends(current_active_user),
):
    """Return the user's daily calorie and macro targets.

    Energy baseline: Mifflin-St Jeor BMR × activity multiplier (TDEE).
    Calorie goal:    TDEE adjusted by BMI category — not by user-stated goal.
    Macro split:     Protein 30% · Carbs 40% · Fat 30%.
    Falls back to 2000 kcal / standard macros when profile is incomplete.
    """
    gender    = user.gender or "female"
    age       = user.age or 30
    height_cm = user.height_cm or 165.0
    weight_kg = user.current_weight_kg or 70.0
    lifestyle = user.lifestyle or "full_time"

    gender_offset = 5 if gender == "male" else (-161 if gender == "female" else -78)
    bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + gender_offset

    activity: dict[str, float] = {
        "wfh": 1.2, "retired": 1.2,
        "full_time": 1.375, "part_time": 1.375,
        "student": 1.55, "homemaker": 1.55,
    }
    tdee = bmr * activity.get(lifestyle, 1.375)

    calories = max(1200, round(tdee + _bmi_calorie_adjustment(weight_kg, height_cm)))

    return NutritionTargetsResponse(
        calorie_target=calories,
        protein_target_g=round(calories * 0.30 / 4, 1),
        carbs_target_g=round(calories * 0.40 / 4, 1),
        fat_target_g=round(calories * 0.30 / 9, 1),
    )


@router.get("/streak")
async def get_streak(
    user: User = Depends(current_active_user),
    service: AnalyticsService = Depends(get_analytics_service),
):
    streak = await service.get_streak(user_id=str(user.id))
    return {"streak": streak}


@router.get("/weekly", response_model=WeeklySummaryResponse)
async def get_weekly_summary(
    user: User = Depends(current_active_user),
    service: AnalyticsService = Depends(get_analytics_service),
):
    logger.info("weekly analytics summary requested user=%s", user.id)
    summary = await service.get_weekly_summary(user_id=str(user.id))
    logger.info(
        "weekly analytics summary completed user=%s days=%s",
        user.id,
        len(summary.week),
    )
    return summary
