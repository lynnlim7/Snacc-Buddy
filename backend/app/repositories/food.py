import uuid
from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.food_log import FoodLog
from app.schemas.food import FoodLogCreate, FoodLogResponse, FoodLogUpdate
from app.services.storage import r2_storage


def _sign_image_urls(response: FoodLogResponse) -> FoodLogResponse:
    """Replace stored R2 object keys with fresh presigned URLs."""
    if not response.image_url:
        return response
    signed = [r2_storage.get_presigned_url(key) or key for key in response.image_url]
    return response.model_copy(update={"image_url": signed})


class FoodRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, data: FoodLogCreate) -> FoodLogResponse:
        a = data.analysis
        log = FoodLog(
            user_id=data.user_id,
            meal_type=data.meal_type,
            meal_name=a.food_name,
            ingredients=[i.model_dump() for i in a.ingredients],
            serving_size=a.serving_size,
            preparation_method=a.preparation_method,
            estimated_total_calories=a.estimated_total_calories,
            protein_g=a.macros.protein_g,
            carbs_g=a.macros.carbs_g,
            fat_g=a.macros.fat_g,
            fibre_g=a.macros.fibre_g,
            sugar_g=a.macros.sugar_g,
            sodium_g=a.macros.sodium_g,
            visible_sauces_or_oils=a.visible_sauces_or_oils,
            cuisine_type=a.cuisine_type,
            restaurant_or_brand=a.restaurant_or_brand,
            confidence=a.overall_confidence,
            ambiguity_flags=a.ambiguity_flags,
            notes=a.notes,
            raw_response=a.model_dump(),
            image_url=data.image_urls,
            inference_log_id=data.inference_log_id,
        )
        self.db.add(log)
        await self.db.commit()
        await self.db.refresh(log)
        return _sign_image_urls(FoodLogResponse.model_validate(log))

    async def get_by_user(
        self, user_id: str, limit: int = 20, offset: int = 0
    ) -> tuple[list[FoodLogResponse], int]:
        count_q = (
            select(func.count()).select_from(FoodLog).where(FoodLog.user_id == user_id)
        )
        total = (await self.db.execute(count_q)).scalar_one()

        q = (
            select(FoodLog)
            .where(FoodLog.user_id == user_id)
            .order_by(FoodLog.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        rows = (await self.db.execute(q)).scalars().all()
        return [_sign_image_urls(FoodLogResponse.model_validate(r)) for r in rows], total

    async def get_by_id(self, log_id: str, user_id: str) -> FoodLogResponse | None:
        q = select(FoodLog).where(
            FoodLog.id == uuid.UUID(log_id),
            FoodLog.user_id == user_id,
        )
        row = (await self.db.execute(q)).scalar_one_or_none()
        return _sign_image_urls(FoodLogResponse.model_validate(row)) if row else None

    async def update(
        self, log_id: str, user_id: str, data: FoodLogUpdate
    ) -> FoodLogResponse | None:
        q = select(FoodLog).where(
            FoodLog.id == uuid.UUID(log_id),
            FoodLog.user_id == user_id,
        )
        log = (await self.db.execute(q)).scalar_one_or_none()
        if not log:
            return None
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(log, field, value)
        await self.db.commit()
        await self.db.refresh(log)
        return _sign_image_urls(FoodLogResponse.model_validate(log))

    async def delete(self, log_id: str, user_id: str) -> bool:
        q = select(FoodLog).where(
            FoodLog.id == uuid.UUID(log_id),
            FoodLog.user_id == user_id,
        )
        log = (await self.db.execute(q)).scalar_one_or_none()
        if not log:
            return False
        await self.db.delete(log)
        await self.db.commit()
        return True

    async def get_streak(self, user_id: str) -> int:
        today = date.today()
        q = (
            select(func.date(FoodLog.created_at).label("log_date"))
            .where(FoodLog.user_id == user_id)
            .group_by(func.date(FoodLog.created_at))
            .order_by(func.date(FoodLog.created_at).desc())
        )
        result = await self.db.execute(q)
        log_dates: set[date] = set()
        for row in result.all():
            d = row.log_date
            log_dates.add(date.fromisoformat(d) if isinstance(d, str) else d)

        if not log_dates:
            return 0

        # Start from today; fall back to yesterday to preserve streak before first log
        start = today if today in log_dates else today - timedelta(days=1)
        if start not in log_dates:
            return 0

        streak = 0
        current = start
        while current in log_dates:
            streak += 1
            current -= timedelta(days=1)
        return streak

    async def get_by_user_for_date(
        self, user_id: str, target_date: date
    ) -> list[FoodLogResponse]:
        q = (
            select(FoodLog)
            .where(
                FoodLog.user_id == user_id,
                func.date(FoodLog.created_at) == target_date,
            )
            .order_by(FoodLog.created_at.asc())
        )
        rows = (await self.db.execute(q)).scalars().all()
        return [_sign_image_urls(FoodLogResponse.model_validate(r)) for r in rows]

    async def get_weekly_summary(self, user_id: str, start_date: date) -> list[dict]:
        end_date = start_date + timedelta(days=6)
        q = select(
            func.date(FoodLog.created_at).label("log_date"),
            func.coalesce(func.sum(FoodLog.estimated_total_calories), 0).label("total_calories"),
            func.coalesce(func.sum(FoodLog.protein_g), 0.0).label("total_protein"),
            func.coalesce(func.sum(FoodLog.carbs_g), 0.0).label("total_carbs"),
            func.coalesce(func.sum(FoodLog.fat_g), 0.0).label("total_fat"),
            func.count(FoodLog.id).label("meal_count"),
        ).where(
            FoodLog.user_id == user_id,
            func.date(FoodLog.created_at) >= start_date,
            func.date(FoodLog.created_at) <= end_date,
        ).group_by(func.date(FoodLog.created_at))
        result = await self.db.execute(q)
        rows_by_date: dict[date, dict] = {}
        for row in result.all():
            d = row.log_date
            if isinstance(d, str):
                d = date.fromisoformat(d)
            rows_by_date[d] = {
                "date": d.isoformat(),
                "total_calories": row.total_calories,
                "total_protein_g": row.total_protein,
                "total_carbs_g": row.total_carbs,
                "total_fat_g": row.total_fat,
                "meal_count": row.meal_count,
            }
        days = [start_date + timedelta(days=i) for i in range(7)]
        return [
            rows_by_date.get(d, {
                "date": d.isoformat(),
                "total_calories": 0,
                "total_protein_g": 0.0,
                "total_carbs_g": 0.0,
                "total_fat_g": 0.0,
                "meal_count": 0,
            })
            for d in days
        ]

    async def get_daily_summary(self, user_id: str, target_date: date) -> dict:
        q = select(
            func.coalesce(func.sum(FoodLog.estimated_total_calories), 0).label(
                "total_calories"
            ),
            func.coalesce(func.sum(FoodLog.protein_g), 0.0).label("total_protein"),
            func.coalesce(func.sum(FoodLog.carbs_g), 0.0).label("total_carbs"),
            func.coalesce(func.sum(FoodLog.fat_g), 0.0).label("total_fat"),
            func.count(FoodLog.id).label("meal_count"),
        ).where(
            FoodLog.user_id == user_id,
            func.date(FoodLog.created_at) == target_date,
        )
        result = (await self.db.execute(q)).one()
        return {
            "date": target_date.isoformat(),
            "total_calories": result.total_calories,
            "total_protein_g": result.total_protein,
            "total_carbs_g": result.total_carbs,
            "total_fat_g": result.total_fat,
            "meal_count": result.meal_count,
        }
