from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from repositories.food import FoodRepository
from schemas.food import FoodLogList, FoodLogResponse
from services.food import FoodService

router = APIRouter()

_MAX_IMAGE_BYTES = 10 * 1024 * 1024


def _get_service(db: AsyncSession = Depends(get_db)) -> FoodService:
    return FoodService(FoodRepository(db))


@router.post("/analyze", response_model=FoodLogResponse, status_code=201)
async def analyze_food(
    user_id: str = Query(..., description="User identifier"),
    image: UploadFile = ...,
    service: FoodService = Depends(_get_service),
):
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=422, detail="Uploaded file must be an image")

    image_bytes = await image.read()
    if len(image_bytes) > _MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image exceeds 10 MB limit")

    return await service.analyze_and_log(user_id=user_id, image_bytes=image_bytes)


@router.get("/logs", response_model=FoodLogList)
async def list_logs(
    user_id: str = Query(...),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    service: FoodService = Depends(_get_service),
):
    items, total = await service.get_logs(user_id, limit, offset)
    return FoodLogList(items=items, total=total)


@router.get("/logs/{log_id}", response_model=FoodLogResponse)
async def get_log(
    log_id: str,
    user_id: str = Query(...),
    service: FoodService = Depends(_get_service),
):
    log = await service.get_log(log_id, user_id)
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    return log
