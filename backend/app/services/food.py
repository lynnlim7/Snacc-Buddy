import hashlib

from app.prompt.gemini import gemini_service
from app.repositories.food import FoodRepository
from app.schemas.food import (
    FoodLogConfirm,
    FoodLogCreate,
    FoodLogResponse,
    FoodLogUpdate,
    GeminiAnalysis,
)
from app.services.cache import get_cached_analysis, set_cached_analysis


class FoodService:
    def __init__(self, repo: FoodRepository) -> None:
        self.repo = repo

    async def analyze_image(
        self,
        image_bytes: bytes,
        mime_type: str,
    ) -> GeminiAnalysis:
        image_hash = hashlib.sha256(image_bytes).hexdigest()
        cached = await get_cached_analysis(image_hash)
        if cached:
            return cached
        analysis = await gemini_service.analyze_food_image(image_bytes, mime_type)
        await set_cached_analysis(image_hash, analysis)
        return analysis

    async def confirm_log(
        self,
        user_id: str,
        payload: FoodLogConfirm,
    ) -> FoodLogResponse:
        log_data = FoodLogCreate(
            user_id=user_id,
            meal_type=payload.meal_type,
            image_urls=payload.image_urls,
            analysis=payload.analysis,
        )
        return await self.repo.create(log_data)

    async def get_logs(
        self, user_id: str, limit: int, offset: int
    ) -> tuple[list[FoodLogResponse], int]:
        return await self.repo.get_by_user(user_id, limit, offset)

    async def get_log(self, log_id: str, user_id: str) -> FoodLogResponse | None:
        return await self.repo.get_by_id(log_id, user_id)

    async def update_log(
        self, log_id: str, user_id: str, data: FoodLogUpdate
    ) -> FoodLogResponse | None:
        return await self.repo.update(log_id, user_id, data)

    async def delete_log(self, log_id: str, user_id: str) -> bool:
        return await self.repo.delete(log_id, user_id)
