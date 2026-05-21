from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import current_active_user
from app.core.database import get_db
from app.models.user import User
from app.repositories.food import FoodRepository

router = APIRouter()


def _get_repo(db: AsyncSession = Depends(get_db)) -> FoodRepository:
    return FoodRepository(db)


@router.get("/daily")
async def daily_summary(
    target_date: date = Query(default_factory=date.today),
    user: User = Depends(current_active_user),
    repo: FoodRepository = Depends(_get_repo),
):
    return await repo.get_daily_summary(str(user.id), target_date)


@router.get("/weekly")
async def weekly_summary(
    user: User = Depends(current_active_user),
    repo: FoodRepository = Depends(_get_repo),
):
    today = date.today()
    days = [today - timedelta(days=i) for i in range(6, -1, -1)]
    summaries = [await repo.get_daily_summary(str(user.id), d) for d in days]
    return {"week": summaries}
