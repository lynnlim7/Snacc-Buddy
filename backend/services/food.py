from ai.gemini import gemini_service
from repositories.food import FoodRepository
from schemas.food import FoodLogCreate, FoodLogResponse


class FoodService:
    def __init__(self, repo: FoodRepository) -> None:
        self.repo = repo

    async def analyze_and_log(
        self, user_id: str, image_bytes: bytes, image_url: str | None = None
    ) -> FoodLogResponse:
        analysis = await gemini_service.analyze_food_image(image_bytes)
        log_data = FoodLogCreate(user_id=user_id, image_url=image_url, analysis=analysis)
        return await self.repo.create(log_data)

    async def get_logs(
        self, user_id: str, limit: int, offset: int
    ) -> tuple[list[FoodLogResponse], int]:
        return await self.repo.get_by_user(user_id, limit, offset)

    async def get_log(self, log_id: str, user_id: str) -> FoodLogResponse | None:
        return await self.repo.get_by_id(log_id, user_id)
