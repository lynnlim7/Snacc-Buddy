import logging

from fastapi import APIRouter, Depends
from fastapi_limiter.depends import RateLimiter

from app.core.auth import current_active_user
from app.core.config import settings
from app.models.user import User
from app.prompt.gemini import gemini_service
from app.schemas.food import FoodChatRequest, GeminiAnalysis

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post(
    "/chat",
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
async def refine_food_analysis(
    payload: FoodChatRequest,
    user: User = Depends(current_active_user),
) -> GeminiAnalysis:
    logger.info("refine_food_analysis user=%s messages=%d", user.id, len(payload.messages))
    messages = [{"role": m.role, "content": m.content} for m in payload.messages]
    return await gemini_service.refine_analysis(payload.prior_analysis, messages)
