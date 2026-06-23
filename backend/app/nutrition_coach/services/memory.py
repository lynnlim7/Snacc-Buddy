import logging
from datetime import date, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.nutrition_coach.models.user_nutrition_summary import UserNutritionSummary
from app.nutrition_coach.repositories.nutrition_summary import NutritionSummaryRepository
from app.nutrition_coach.utils.nutrition import compute_nutrition_targets

logger = logging.getLogger(__name__)


class NutritionMemoryService:
    """Stage-1A: builds and persists a nutrition snapshot for a user.

    Aggregates 7d and 30d rolling averages from food_logs, computes nutrition
    targets from the user's profile, and writes a UserNutritionSummary row.
    The persisted snapshot is consumed by the NutritionInsightEngine (Stage 1B)
    and the RetrievalAgent query builder (Stage 1C).
    """

    def __init__(self, db: AsyncSession) -> None:
        self._repo = NutritionSummaryRepository(db)

    async def build_snapshot(self, user: User) -> UserNutritionSummary:
        user_id = str(user.id)
        today = date.today()

        seven_day_start = today - timedelta(days=6)
        thirty_day_start = today - timedelta(days=29)

        avgs_7d = await self._repo.get_period_averages(user_id, seven_day_start, today)
        avgs_30d = await self._repo.get_period_averages(user_id, thirty_day_start, today)
        logging_freq = await self._repo.get_logging_frequency_7d(user_id, today)

        targets = compute_nutrition_targets(
            gender=user.gender,
            age=user.age,
            height_cm=user.height_cm,
            weight_kg=user.current_weight_kg,
            lifestyle=user.lifestyle,
        )

        summary = UserNutritionSummary(
            user_id=user_id,
            snapshot_date=today,
            avg_calories_7d=avgs_7d["avg_calories"],
            avg_protein_g_7d=avgs_7d["avg_protein_g"],
            avg_carbs_g_7d=avgs_7d["avg_carbs_g"],
            avg_fat_g_7d=avgs_7d["avg_fat_g"],
            avg_fibre_g_7d=avgs_7d["avg_fibre_g"],
            avg_sodium_g_7d=avgs_7d["avg_sodium_g"],
            avg_calories_30d=avgs_30d["avg_calories"],
            avg_protein_g_30d=avgs_30d["avg_protein_g"],
            avg_carbs_g_30d=avgs_30d["avg_carbs_g"],
            avg_fat_g_30d=avgs_30d["avg_fat_g"],
            avg_fibre_g_30d=avgs_30d["avg_fibre_g"],
            avg_sodium_g_30d=avgs_30d["avg_sodium_g"],
            logging_frequency_7d=logging_freq,
            calorie_target=targets.calories,
            protein_target_g=targets.protein_g,
            carbs_target_g=targets.carbs_g,
            fat_target_g=targets.fat_g,
        )

        saved = await self._repo.save_summary(summary)
        logger.info(
            "nutrition_memory.snapshot user=%s calories_7d=%.0f protein_7d=%.0f freq=%.2f",
            user_id,
            avgs_7d["avg_calories"],
            avgs_7d["avg_protein_g"],
            logging_freq,
        )
        return saved
