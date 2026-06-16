from datetime import date, timedelta

from app.repositories.food import FoodRepository
from app.schemas.analytics import DailySummaryResponse, WeeklySummaryResponse


class AnalyticsService:
    def __init__(self, repo: FoodRepository) -> None:
        self.repo = repo

    async def get_daily_summary(
        self,
        user_id: str,
        target_date: date,
    ) -> DailySummaryResponse:
        summary = await self.repo.get_daily_summary(user_id, target_date)
        return DailySummaryResponse(**summary)

    async def get_weekly_summary(self, user_id: str) -> WeeklySummaryResponse:
        start_date = date.today() - timedelta(days=6)
        rows = await self.repo.get_weekly_summary(user_id, start_date)
        return WeeklySummaryResponse(
            week=[DailySummaryResponse(**row) for row in rows]
        )

    async def get_streak(self, user_id: str) -> int:
        return await self.repo.get_streak(user_id)
