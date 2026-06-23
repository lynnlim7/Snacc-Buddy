import logging
from datetime import date as date_type

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import current_active_user
from app.core.database import get_db
from app.models.user import User
from app.repositories.food import FoodRepository
from app.schemas.food import FoodLogConfirm, FoodLogList, FoodLogResponse, FoodLogUpdate
from app.services.food import FoodService

router = APIRouter()
logger = logging.getLogger(__name__)


def get_food_service(db: AsyncSession = Depends(get_db)) -> FoodService:
    return FoodService(FoodRepository(db))


@router.post("/logs", response_model=FoodLogResponse, status_code=status.HTTP_201_CREATED)
async def confirm_food_log(
    payload: FoodLogConfirm,
    user: User = Depends(current_active_user),
    service: FoodService = Depends(get_food_service),
) -> FoodLogResponse:
    logger.info("confirm_food_log user=%s meal_type=%s", user.id, payload.meal_type)
    return await service.confirm_log(user_id=str(user.id), payload=payload, user=user)


@router.get("/logs", response_model=FoodLogList)
async def list_food_logs(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    date: date_type | None = Query(None, description="Filter by date (YYYY-MM-DD)"),
    user: User = Depends(current_active_user),
    service: FoodService = Depends(get_food_service),
) -> FoodLogList:
    items, total = await service.get_logs(str(user.id), limit, offset, date)
    return FoodLogList(items=items, total=total)


@router.get("/logs/{log_id}", response_model=FoodLogResponse)
async def get_food_log(
    log_id: str,
    user: User = Depends(current_active_user),
    service: FoodService = Depends(get_food_service),
) -> FoodLogResponse:
    log = await service.get_log(log_id, str(user.id))
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Log not found.")
    return log


@router.patch("/logs/{log_id}", response_model=FoodLogResponse)
async def update_food_log(
    log_id: str,
    data: FoodLogUpdate,
    user: User = Depends(current_active_user),
    service: FoodService = Depends(get_food_service),
) -> FoodLogResponse:
    log = await service.update_log(log_id, str(user.id), data)
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Log not found.")
    return log


@router.delete("/logs/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_food_log(
    log_id: str,
    user: User = Depends(current_active_user),
    service: FoodService = Depends(get_food_service),
) -> None:
    deleted = await service.delete_log(log_id, str(user.id))
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Log not found.")
