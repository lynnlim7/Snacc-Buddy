from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import current_active_user
from app.core.database import get_db
from app.models.user import User
from app.repositories.food import FoodRepository
from app.schemas.food import FoodLogList, FoodLogResponse
from app.services.food import FoodService

router = APIRouter()


def _get_service(db: AsyncSession = Depends(get_db)) -> FoodService:
    return FoodService(FoodRepository(db))


@router.get("/logs", response_model=FoodLogList)
async def list_logs(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user: User = Depends(current_active_user),
    service: FoodService = Depends(_get_service),
):
    items, total = await service.get_logs(str(user.id), limit, offset)
    return FoodLogList(items=items, total=total)


@router.get("/logs/{log_id}", response_model=FoodLogResponse)
async def get_log(
    log_id: str,
    user: User = Depends(current_active_user),
    service: FoodService = Depends(_get_service),
):
    log = await service.get_log(log_id, str(user.id))
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    return log
