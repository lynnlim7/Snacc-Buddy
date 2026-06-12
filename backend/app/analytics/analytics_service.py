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
        today = date.today()
        days = [today - timedelta(days=i) for i in range(6, -1, -1)]
        summaries = [
            await self.get_daily_summary(user_id=user_id, target_date=target_date)
            for target_date in days
        ]
        return WeeklySummaryResponse(week=summaries)

    async def get_streak(self, user_id: str) -> int:
        return await self.repo.get_streak(user_id)
