from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.food_log import FoodLog
from app.nutrition_coach.models.nutrition_insight import NutritionInsight
from app.nutrition_coach.models.user_nutrition_summary import UserNutritionSummary


class NutritionSummaryRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_period_averages(self, user_id: str, start_date: date, end_date: date) -> dict:
        """Return per-day averages for a date range (days with no logs contribute 0)."""
        q = select(
            func.coalesce(func.avg(FoodLog.estimated_total_calories), 0.0).label("avg_calories"),
            func.coalesce(func.avg(FoodLog.protein_g), 0.0).label("avg_protein_g"),
            func.coalesce(func.avg(FoodLog.carbs_g), 0.0).label("avg_carbs_g"),
            func.coalesce(func.avg(FoodLog.fat_g), 0.0).label("avg_fat_g"),
            func.coalesce(func.avg(FoodLog.fibre_g), 0.0).label("avg_fibre_g"),
            func.coalesce(func.avg(FoodLog.sodium_g), 0.0).label("avg_sodium_g"),
        ).where(
            FoodLog.user_id == user_id,
            func.date(FoodLog.created_at) >= start_date,
            func.date(FoodLog.created_at) <= end_date,
        )
        row = (await self.db.execute(q)).one()
        return {
            "avg_calories": float(row.avg_calories),
            "avg_protein_g": float(row.avg_protein_g),
            "avg_carbs_g": float(row.avg_carbs_g),
            "avg_fat_g": float(row.avg_fat_g),
            "avg_fibre_g": float(row.avg_fibre_g),
            "avg_sodium_g": float(row.avg_sodium_g),
        }

    async def get_logging_frequency_7d(self, user_id: str, today: date) -> float:
        """Return fraction of the last 7 days that had at least one food log (0.0–1.0)."""
        start = today - timedelta(days=6)
        q = (
            select(func.count(func.distinct(func.date(FoodLog.created_at))))
            .where(
                FoodLog.user_id == user_id,
                func.date(FoodLog.created_at) >= start,
                func.date(FoodLog.created_at) <= today,
            )
        )
        days_logged = (await self.db.execute(q)).scalar_one() or 0
        return days_logged / 7.0

    async def save_summary(self, summary: UserNutritionSummary) -> UserNutritionSummary:
        self.db.add(summary)
        await self.db.flush()
        await self.db.refresh(summary)
        return summary

    async def get_latest_summary(self, user_id: str) -> UserNutritionSummary | None:
        q = (
            select(UserNutritionSummary)
            .where(UserNutritionSummary.user_id == user_id)
            .order_by(UserNutritionSummary.created_at.desc())
            .limit(1)
        )
        return (await self.db.execute(q)).scalar_one_or_none()

    async def save_insight(self, insight: NutritionInsight) -> NutritionInsight:
        self.db.add(insight)
        await self.db.flush()
        await self.db.refresh(insight)
        return insight

    async def get_latest_insight(self, user_id: str) -> NutritionInsight | None:
        q = (
            select(NutritionInsight)
            .where(NutritionInsight.user_id == user_id)
            .order_by(NutritionInsight.created_at.desc())
            .limit(1)
        )
        return (await self.db.execute(q)).scalar_one_or_none()
