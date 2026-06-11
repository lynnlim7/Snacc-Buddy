import logging
from uuid import UUID

from app.ai_governance.enums.model_enums import ModelStatus
from app.ai_governance.exceptions.governance_exceptions import (
    ModelIdentifierConflictError,
    ModelNotFoundError,
    RetiredModelCannotBeDefaultError,
)
from app.ai_governance.models.ai_model import AIModel
from app.ai_governance.repositories.model_registry import ModelRegistryRepository
from app.ai_governance.schemas.ai_model import AIModelCreate, AIModelUpdate

logger = logging.getLogger(__name__)


class ModelRegistryService:
    def __init__(self, repo: ModelRegistryRepository) -> None:
        self.repo = repo

    async def create_model(self, data: AIModelCreate, created_by: str) -> AIModel:
        existing = await self.repo.get_by_identifier_and_version(
            data.model_identifier, data.version
        )
        if existing:
            raise ModelIdentifierConflictError(
                f"Model '{data.model_identifier}' version '{data.version}' already registered."
            )
        model = AIModel(**data.model_dump(), created_by=created_by)
        result = await self.repo.create(model)
        logger.info(
            "model_registry.created id=%s identifier=%s version=%s by=%s",
            result.id, data.model_identifier, data.version, created_by,
        )
        return result

    async def update_model(self, model_id: UUID, data: AIModelUpdate) -> AIModel:
        model = await self.repo.get_by_id(model_id)
        if not model:
            raise ModelNotFoundError(model_id)
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(model, field, value)
        result = await self.repo.update(model)
        logger.info("model_registry.updated id=%s", model_id)
        return result

    async def set_default_model(self, model_id: UUID) -> AIModel:
        model = await self.repo.get_by_id(model_id)
        if not model:
            raise ModelNotFoundError(model_id)
        if model.status == ModelStatus.RETIRED:
            raise RetiredModelCannotBeDefaultError(model_id)
        await self.repo.clear_default_flag()
        model.is_default = True
        result = await self.repo.update(model)
        logger.info("model_registry.set_default id=%s", model_id)
        return result

    async def retire_model(self, model_id: UUID) -> AIModel:
        model = await self.repo.get_by_id(model_id)
        if not model:
            raise ModelNotFoundError(model_id)
        if model.is_default:
            raise ValueError(
                "Cannot retire the default model. Assign a new default first."
            )
        model.status = ModelStatus.RETIRED
        model.is_default = False
        result = await self.repo.update(model)
        logger.warning("model_registry.retired id=%s", model_id)
        return result

    async def deprecate_model(self, model_id: UUID) -> AIModel:
        model = await self.repo.get_by_id(model_id)
        if not model:
            raise ModelNotFoundError(model_id)
        model.status = ModelStatus.DEPRECATED
        result = await self.repo.update(model)
        logger.info("model_registry.deprecated id=%s", model_id)
        return result

    async def get_default_model(self) -> AIModel | None:
        return await self.repo.get_default_model()

    async def get_model(self, model_id: UUID) -> AIModel:
        model = await self.repo.get_by_id(model_id)
        if not model:
            raise ModelNotFoundError(model_id)
        return model

    async def list_models(
        self, limit: int = 20, offset: int = 0, status: str | None = None
    ) -> tuple[list[AIModel], int]:
        return await self.repo.list_paginated(
            limit=limit, offset=offset, status=status
        )
