from typing import Any, Generic, TypeVar
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

ModelT = TypeVar("ModelT")


class BaseRepository(Generic[ModelT]):
    """
    Generic async repository providing basic CRUD + paginated list.

    Domain-specific repositories subclass this and add query methods.
    The generic approach eliminates copy-paste CRUD while keeping
    domain logic clearly separated in subclasses.
    """

    model: type[ModelT]

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, id: UUID) -> ModelT | None:
        return await self.db.get(self.model, id)

    async def create(self, instance: ModelT) -> ModelT:
        self.db.add(instance)
        await self.db.commit()
        await self.db.refresh(instance)
        return instance

    async def update(self, instance: ModelT) -> ModelT:
        await self.db.commit()
        await self.db.refresh(instance)
        return instance

    async def delete(self, instance: ModelT) -> None:
        await self.db.delete(instance)
        await self.db.commit()

    async def list_paginated(
        self,
        limit: int = 20,
        offset: int = 0,
        **filters: Any,
    ) -> tuple[list[ModelT], int]:
        """
        Generic paginated list with equality filters.
        Complex queries (joins, date ranges) live in subclass methods.
        """
        q = select(self.model)
        for attr, value in filters.items():
            if value is not None:
                q = q.where(getattr(self.model, attr) == value)

        count_q = select(func.count()).select_from(q.subquery())
        total = (await self.db.execute(count_q)).scalar_one()

        rows = (await self.db.execute(q.limit(limit).offset(offset))).scalars().all()
        return list(rows), total
