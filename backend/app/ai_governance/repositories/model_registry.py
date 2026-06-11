from uuid import UUID

from sqlalchemy import select

from app.ai_governance.enums.model_enums import ModelStatus
from app.ai_governance.models.ai_model import AIModel
from app.ai_governance.repositories.base import BaseRepository


class ModelRegistryRepository(BaseRepository[AIModel]):
    model = AIModel

    async def get_default_model(self) -> AIModel | None:
        q = select(AIModel).where(
            AIModel.is_default == True,
            AIModel.status == ModelStatus.ACTIVE,
        )
        return (await self.db.execute(q)).scalar_one_or_none()

    async def get_by_identifier_and_version(
        self, model_identifier: str, version: str
    ) -> AIModel | None:
        q = select(AIModel).where(
            AIModel.model_identifier == model_identifier,
            AIModel.version == version,
        )
        return (await self.db.execute(q)).scalar_one_or_none()

    async def clear_default_flag(self) -> None:
        """
        Unset is_default on all models.
        Uses flush (not commit) — caller owns the transaction boundary.
        """
        q = select(AIModel).where(AIModel.is_default == True)
        models = (await self.db.execute(q)).scalars().all()
        for m in models:
            m.is_default = False
        await self.db.flush()
