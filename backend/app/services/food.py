from app.ai.gemini import gemini_service
from app.repositories.food import FoodRepository
from app.schemas.food import FoodLogCreate, FoodLogResponse, GeminiAnalysis


class FoodService:
    def __init__(self, repo: FoodRepository) -> None:
        self.repo = repo

    async def analyze_and_log(
        self,
        user_id: str,
        image_bytes: bytes,
        mime_type: str = "image/jpeg",
        image_urls: list[str] | None = None,
    ) -> FoodLogResponse:
        analysis = await gemini_service.analyze_food_image(image_bytes, mime_type)
        log_data = FoodLogCreate(user_id=user_id, image_urls=image_urls or [], analysis=analysis)
        return await self.repo.create(log_data)

    async def log_analysis(
        self,
        user_id: str,
        analysis: GeminiAnalysis,
        image_urls: list[str] | None = None,
    ) -> FoodLogResponse:
        log_data = FoodLogCreate(user_id=user_id, image_urls=image_urls or [], analysis=analysis)
        return await self.repo.create(log_data)

    async def get_logs(
        self, user_id: str, limit: int, offset: int
    ) -> tuple[list[FoodLogResponse], int]:
        return await self.repo.get_by_user(user_id, limit, offset)

    async def get_log(self, log_id: str, user_id: str) -> FoodLogResponse | None:
        return await self.repo.get_by_id(log_id, user_id)
