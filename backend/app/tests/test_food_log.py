"""
Unit tests for food log business logic.

Uses AsyncMock to isolate from the database — no live PostgreSQL required.
"""
import uuid
from datetime import date, timedelta
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.repositories.food import FoodRepository
from app.schemas.food import FoodLogConfirm, GeminiAnalysis, MacroNutrients


# ── helpers ───────────────────────────────────────────────────────────────────

def _analysis(**kwargs) -> GeminiAnalysis:
    return GeminiAnalysis(
        food_name="Test meal",
        estimated_total_calories=500,
        macros=MacroNutrients(protein_g=30, carbs_g=50, fat_g=10),
        ambiguity_flags=[],
        overall_confidence=0.9,
        **kwargs,
    )


def _confirm_payload(inference_log_id=None) -> FoodLogConfirm:
    return FoodLogConfirm(
        meal_type="lunch",
        image_urls=[],
        analysis=_analysis(),
        inference_log_id=inference_log_id,
    )


# ── T1: confirm_log threads inference_log_id from payload ────────────────────

class TestConfirmLog:
    async def test_inference_log_id_from_payload(self):
        from app.services.food import FoodService

        repo = AsyncMock()
        repo.create = AsyncMock(return_value=MagicMock())
        expected_id = uuid.uuid4()

        await FoodService(repo).confirm_log(
            user_id="u1", payload=_confirm_payload(inference_log_id=expected_id)
        )

        create_arg = repo.create.call_args[0][0]
        assert create_arg.inference_log_id == expected_id

    async def test_inference_log_id_none_when_absent(self):
        from app.services.food import FoodService

        repo = AsyncMock()
        repo.create = AsyncMock(return_value=MagicMock())

        await FoodService(repo).confirm_log(user_id="u1", payload=_confirm_payload())

        create_arg = repo.create.call_args[0][0]
        assert create_arg.inference_log_id is None


# ── Daily summary aggregation ─────────────────────────────────────────────────

class TestDailySummary:
    async def test_returns_daily_summary_response(self):
        from app.analytics.analytics_service import AnalyticsService
        from app.schemas.analytics import DailySummaryResponse

        repo = AsyncMock()
        today = date.today()
        repo.get_daily_summary = AsyncMock(return_value={
            "date": today.isoformat(),
            "total_calories": 1800,
            "total_protein_g": 90.0,
            "total_carbs_g": 200.0,
            "total_fat_g": 60.0,
            "meal_count": 4,
        })

        result = await AnalyticsService(repo).get_daily_summary("u1", today)

        assert isinstance(result, DailySummaryResponse)
        assert result.total_calories == 1800
        assert result.meal_count == 4

    async def test_zero_summary_for_empty_day(self):
        from app.analytics.analytics_service import AnalyticsService

        repo = AsyncMock()
        today = date.today()
        repo.get_daily_summary = AsyncMock(return_value={
            "date": today.isoformat(),
            "total_calories": 0,
            "total_protein_g": 0.0,
            "total_carbs_g": 0.0,
            "total_fat_g": 0.0,
            "meal_count": 0,
        })

        result = await AnalyticsService(repo).get_daily_summary("u1", today)

        assert result.total_calories == 0
        assert result.meal_count == 0


# ── Streak logic ──────────────────────────────────────────────────────────────

class TestStreakLogic:
    async def _streak(self, log_dates: list[date]) -> int:
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.all.return_value = [MagicMock(log_date=d) for d in log_dates]
        mock_db.execute = AsyncMock(return_value=mock_result)
        return await FoodRepository(mock_db).get_streak("u1")

    async def test_zero_when_no_logs(self):
        assert await self._streak([]) == 0

    async def test_one_for_today_only(self):
        assert await self._streak([date.today()]) == 1

    async def test_consecutive_days(self):
        today = date.today()
        assert await self._streak([today - timedelta(days=i) for i in range(3)]) == 3

    async def test_resets_after_gap(self):
        today = date.today()
        # logs today and 2 days ago — yesterday missing, so streak = 1
        assert await self._streak([today, today - timedelta(days=2)]) == 1

    async def test_zero_when_last_log_is_old(self):
        assert await self._streak([date.today() - timedelta(days=3)]) == 0


# ── Delete ownership check ────────────────────────────────────────────────────

class TestDeleteOwnership:
    async def test_returns_false_for_wrong_user(self):
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=mock_result)

        result = await FoodRepository(mock_db).delete(str(uuid.uuid4()), "wrong-user")

        assert result is False

    async def test_returns_true_and_deletes_for_owner(self):
        mock_db = AsyncMock()
        mock_log = MagicMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_log
        mock_db.execute = AsyncMock(return_value=mock_result)

        result = await FoodRepository(mock_db).delete(str(uuid.uuid4()), "owner")

        assert result is True
        mock_db.delete.assert_awaited_once_with(mock_log)
