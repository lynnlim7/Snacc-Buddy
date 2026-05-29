import logging

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi_limiter.depends import RateLimiter
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import current_active_user
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.repositories.food import FoodRepository
from app.schemas.food import GeminiAnalysis
from app.services.food import FoodService

router = APIRouter()
logger = logging.getLogger(__name__)

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}


def get_food_service(db: AsyncSession = Depends(get_db)) -> FoodService:
    return FoodService(FoodRepository(db))


@router.post(
    "/analyze",
    response_model=GeminiAnalysis,
    dependencies=[
        Depends(
            RateLimiter(
                times=settings.AI_RATE_LIMIT_REQUESTS,
                seconds=settings.AI_RATE_LIMIT_WINDOW_SECONDS,
            )
        )
    ],
)
async def analyze_food_image(
    image: UploadFile = File(...),
    user: User = Depends(current_active_user),
    service: FoodService = Depends(get_food_service),
) -> GeminiAnalysis:
    logger.info("analyze_food_image user=%s content_type=%s", user.id, image.content_type)

    if image.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type. Allowed: jpeg, png, webp.",
        )

    image_bytes = await image.read()

    if len(image_bytes) > settings.MAX_IMAGE_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image exceeds {settings.MAX_IMAGE_SIZE_MB} MB limit.",
        )

    return await service.analyze_image(image_bytes, image.content_type or "image/jpeg")
