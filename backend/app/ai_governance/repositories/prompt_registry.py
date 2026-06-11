from uuid import UUID

from sqlalchemy import func, select

from app.ai_governance.enums.prompt_enums import PromptStatus
from app.ai_governance.models.prompt_version import PromptVersion
from app.ai_governance.repositories.base import BaseRepository


class PromptRegistryRepository(BaseRepository[PromptVersion]):
    model = PromptVersion

    async def get_active_prompt_for_model(self, model_id: UUID) -> PromptVersion | None:
        q = select(PromptVersion).where(
            PromptVersion.model_id == model_id,
            PromptVersion.is_active == True,
        )
        return (await self.db.execute(q)).scalar_one_or_none()

    async def get_next_version_number(self, model_id: UUID) -> int:
        q = select(func.coalesce(func.max(PromptVersion.version), 0)).where(
            PromptVersion.model_id == model_id
        )
        max_ver = (await self.db.execute(q)).scalar_one()
        return int(max_ver) + 1

    async def deactivate_all_for_model(self, model_id: UUID) -> None:
        """
        Retire all active prompts for a model before activating a new one.
        Uses flush — caller owns the transaction boundary.
        """
        q = select(PromptVersion).where(
            PromptVersion.model_id == model_id,
            PromptVersion.is_active == True,
        )
        prompts = (await self.db.execute(q)).scalars().all()
        for p in prompts:
            p.is_active = False
            p.status = PromptStatus.RETIRED
        await self.db.flush()

    async def get_history(
        self, model_id: UUID, limit: int = 20, offset: int = 0
    ) -> tuple[list[PromptVersion], int]:
        q = (
            select(PromptVersion)
            .where(PromptVersion.model_id == model_id)
            .order_by(PromptVersion.version.desc())
        )
        count = (
            await self.db.execute(select(func.count()).select_from(q.subquery()))
        ).scalar_one()
        rows = (
            await self.db.execute(q.limit(limit).offset(offset))
        ).scalars().all()
        return list(rows), count
