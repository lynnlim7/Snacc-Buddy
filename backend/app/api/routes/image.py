import hashlib
import logging

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

logger = logging.getLogger(__name__)
from fastapi_limiter.depends import RateLimiter
from sqlalchemy.ext.asyncio import AsyncSession

from app.prompt.gemini import gemini_service
from app.core.auth import current_active_user
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.repositories.food import FoodRepository
from app.schemas.food import FoodLogResponse
from app.services.cache import get_cached_analysis, set_cached_analysis
from app.services.food import FoodService

router = APIRouter()

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}


def get_food_service(db: AsyncSession = Depends(get_db)) -> FoodService:
    return FoodService(FoodRepository(db))


@router.post(
    "/analyze",
    response_model=FoodLogResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(RateLimiter(times=settings.AI_RATE_LIMIT_REQUESTS, seconds=settings.AI_RATE_LIMIT_WINDOW_SECONDS))],
)
async def analyze_food(
    image: UploadFile = File(...),
    user: User = Depends(current_active_user),
    service: FoodService = Depends(get_food_service),
):
    logger.info("analyze_food entered for user=%s content_type=%s", user.id, image.content_type)
    if image.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type: {image.content_type}. Allowed: jpeg, png, webp.",
        )

    image_bytes = await image.read()

    max_bytes = settings.MAX_IMAGE_SIZE_MB * 1024 * 1024
    if len(image_bytes) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image exceeds {settings.MAX_IMAGE_SIZE_MB} MB limit.",
        )

    image_hash = hashlib.sha256(image_bytes).hexdigest()

    # Cache hit — skip Gemini entirely, just log the cached analysis.
    cached = await get_cached_analysis(image_hash)
    if cached:
        return await service.log_analysis(user_id=str(user.id), analysis=cached)

    analysis = await gemini_service.analyze_food_image(
        image_bytes=image_bytes,
        mime_type=image.content_type or "image/jpeg",
    )
    await set_cached_analysis(image_hash, analysis)
    return await service.log_analysis(user_id=str(user.id), analysis=analysis)
