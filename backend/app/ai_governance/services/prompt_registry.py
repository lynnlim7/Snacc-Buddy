import hashlib
import logging
from uuid import UUID

from app.ai_governance.enums.prompt_enums import PromptStatus
from app.ai_governance.exceptions.governance_exceptions import (
    ActivePromptImmutableError,
    ModelNotFoundError,
    NoActivePromptError,
    PromptNotFoundError,
)
from app.ai_governance.models.prompt_version import PromptVersion
from app.ai_governance.repositories.model_registry import ModelRegistryRepository
from app.ai_governance.repositories.prompt_registry import PromptRegistryRepository
from app.ai_governance.schemas.prompt_version import PromptVersionCreate

logger = logging.getLogger(__name__)


class PromptRegistryService:
    def __init__(
        self,
        prompt_repo: PromptRegistryRepository,
        model_repo: ModelRegistryRepository,
    ) -> None:
        self.prompt_repo = prompt_repo
        self.model_repo = model_repo

    async def create_prompt_version(
        self, data: PromptVersionCreate, created_by: str
    ) -> PromptVersion:
        model = await self.model_repo.get_by_id(data.model_id)
        if not model:
            raise ModelNotFoundError(data.model_id)

        next_version = await self.prompt_repo.get_next_version_number(data.model_id)
        content_hash = hashlib.sha256(data.prompt_template.encode("utf-8")).hexdigest()

        prompt = PromptVersion(
            model_id=data.model_id,
            version=next_version,
            name=data.name,
            prompt_template=data.prompt_template,
            content_hash=content_hash,
            description=data.description,
            status=PromptStatus.DRAFT,
            is_active=False,
            created_by=created_by,
        )
        result = await self.prompt_repo.create(prompt)
        logger.info(
            "prompt_registry.created id=%s model_id=%s version=%d hash=%s",
            result.id, data.model_id, next_version, content_hash[:8],
        )
        return result

    async def activate_prompt(self, prompt_id: UUID) -> PromptVersion:
        """
        Activates a prompt version.

        Business rules enforced:
        - Cannot activate an already-active prompt (idempotent return)
        - Cannot activate a RETIRED prompt
        - Activating retires all currently active prompts for the same model
        - Active prompts are immutable — enforced by content_hash comparison at read time
        """
        prompt = await self.prompt_repo.get_by_id(prompt_id)
        if not prompt:
            raise PromptNotFoundError(prompt_id)
        if prompt.status == PromptStatus.ACTIVE:
            return prompt  # idempotent
        if prompt.status == PromptStatus.RETIRED:
            raise ActivePromptImmutableError(prompt_id)

        await self.prompt_repo.deactivate_all_for_model(prompt.model_id)
        prompt.status = PromptStatus.ACTIVE
        prompt.is_active = True
        result = await self.prompt_repo.update(prompt)
        logger.info(
            "prompt_registry.activated id=%s model_id=%s version=%d",
            prompt_id, prompt.model_id, prompt.version,
        )
        return result

    async def retire_prompt(self, prompt_id: UUID) -> PromptVersion:
        prompt = await self.prompt_repo.get_by_id(prompt_id)
        if not prompt:
            raise PromptNotFoundError(prompt_id)
        prompt.is_active = False
        prompt.status = PromptStatus.RETIRED
        result = await self.prompt_repo.update(prompt)
        logger.info("prompt_registry.retired id=%s", prompt_id)
        return result

    async def get_active_prompt(self, model_id: UUID) -> PromptVersion:
        prompt = await self.prompt_repo.get_active_prompt_for_model(model_id)
        if not prompt:
            raise NoActivePromptError(model_id)
        return prompt

    async def get_prompt_history(
        self, model_id: UUID, limit: int = 20, offset: int = 0
    ) -> tuple[list[PromptVersion], int]:
        return await self.prompt_repo.get_history(model_id, limit, offset)

    async def get_prompt(self, prompt_id: UUID) -> PromptVersion:
        prompt = await self.prompt_repo.get_by_id(prompt_id)
        if not prompt:
            raise PromptNotFoundError(prompt_id)
        return prompt
