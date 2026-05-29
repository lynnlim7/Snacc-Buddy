import logging
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.analytics.analytics_service import AnalyticsService
from app.core.auth import current_active_user
from app.core.database import get_db
from app.models.user import User
from app.repositories.food import FoodRepository
from app.schemas.analytics import DailySummaryResponse, WeeklySummaryResponse

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
