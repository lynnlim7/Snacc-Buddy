import logging

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi_limiter.depends import RateLimiter
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import current_active_user
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.repositories.food import FoodRepository
from app.schemas.food import AnalyzeResponse, GeminiAnalysis
from app.services.food import FoodService
from app.ai_governance.api.deps import get_inference_audit_service
from app.ai_governance.repositories.model_registry import ModelRegistryRepository
from app.ai_governance.repositories.prompt_registry import PromptRegistryRepository
from app.ai_governance.services.inference_audit import InferenceAuditService
from app.services.storage import r2_storage

router = APIRouter()
logger = logging.getLogger(__name__)

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}


def get_food_service(db: AsyncSession = Depends(get_db)) -> FoodService:
    return FoodService(FoodRepository(db))


@router.post(
    "/analyze",
    response_model=AnalyzeResponse,
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
    audit_service: InferenceAuditService = Depends(get_inference_audit_service),
    db: AsyncSession = Depends(get_db),
) -> AnalyzeResponse:
    logger.info(
        "analyze_food_image user=%s content_type=%s", user.id, image.content_type
    )

    if image.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported file type. Allowed: jpeg, png, webp.",
        )

    # Read in chunks so the size limit fires before the full upload lands in memory.
    max_bytes = settings.MAX_IMAGE_SIZE_MB * 1024 * 1024
    chunks: list[bytes] = []
    total = 0
    async for chunk in image:
        total += len(chunk)
        if total > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Image exceeds {settings.MAX_IMAGE_SIZE_MB} MB limit.",
            )
        chunks.append(chunk)
    image_bytes = b"".join(chunks)

    # Resolve default model and active prompt from governance registry
    model_repo = ModelRegistryRepository(db)
    prompt_repo = PromptRegistryRepository(db)

    default_model = await model_repo.get_default_model()
    if not default_model:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "No default AI model is configured. "
                "Register and activate a model via /api/v1/governance/models."
            ),
        )

    active_prompt = await prompt_repo.get_active_prompt_for_model(default_model.id)
    if not active_prompt:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "No active prompt is configured for the default model. "
                "Activate a prompt version via /api/v1/governance/prompts."
            ),
        )

    mime_type = image.content_type or "image/jpeg"

    # Upload to R2 and run AI analysis concurrently — neither blocks the other.
    import asyncio as _asyncio
    image_key, (analysis, inference_log_id) = await _asyncio.gather(
        r2_storage.upload_image(image_bytes, mime_type),
        service.analyze_image(
            image_bytes=image_bytes,
            mime_type=mime_type,
            audit_service=audit_service,
            model_id=default_model.id,
            prompt_version_id=active_prompt.id,
        ),
    )

    # Presigned URL is for immediate display only — it expires in 1 hour.
    # The frontend must pass image_key (not image_url) to confirmLog for durable storage.
    image_url = r2_storage.get_presigned_url(image_key) if image_key else None

    return AnalyzeResponse(
        analysis=analysis,
        inference_log_id=inference_log_id,
        image_key=image_key,
        image_url=image_url,
    )
