"""
Unit tests for PromptRegistryService.
"""
import uuid
from unittest.mock import MagicMock

import pytest

from app.ai_governance.enums.prompt_enums import PromptStatus
from app.ai_governance.exceptions.governance_exceptions import (
    ActivePromptImmutableError,
    ModelNotFoundError,
    PromptNotFoundError,
)
from app.ai_governance.schemas.prompt_version import PromptVersionCreate
from app.ai_governance.services.prompt_registry import PromptRegistryService


@pytest.fixture
def create_data(model_id):
    return PromptVersionCreate(
        model_id=model_id,
        name="v1 food analysis",
        prompt_template="Analyse the food image carefully.",
        description="Initial version",
    )


class TestPromptRegistryService:
    def _service(self, mock_prompt_repo, mock_model_repo) -> PromptRegistryService:
        return PromptRegistryService(mock_prompt_repo, mock_model_repo)

    async def test_create_prompt_assigns_correct_version(
        self, mock_prompt_repo, mock_model_repo, create_data
    ):
        mock_prompt_repo.get_next_version_number.return_value = 3
        service = self._service(mock_prompt_repo, mock_model_repo)
        await service.create_prompt_version(create_data, created_by="user_1")
        created = mock_prompt_repo.create.call_args[0][0]
        assert created.version == 3

    async def test_create_prompt_hashes_content(
        self, mock_prompt_repo, mock_model_repo, create_data
    ):
        service = self._service(mock_prompt_repo, mock_model_repo)
        await service.create_prompt_version(create_data, created_by="user_1")
        created = mock_prompt_repo.create.call_args[0][0]
        assert len(created.content_hash) == 64  # SHA-256 hex digest

    async def test_create_prompt_same_template_same_hash(
        self, mock_prompt_repo, mock_model_repo, create_data
    ):
        service = self._service(mock_prompt_repo, mock_model_repo)
        await service.create_prompt_version(create_data, created_by="user_1")
        first_hash = mock_prompt_repo.create.call_args[0][0].content_hash
        mock_prompt_repo.create.reset_mock()
        await service.create_prompt_version(create_data, created_by="user_2")
        second_hash = mock_prompt_repo.create.call_args[0][0].content_hash
        assert first_hash == second_hash  # deterministic hash

    async def test_create_prompt_model_not_found_raises(
        self, mock_prompt_repo, mock_model_repo, create_data
    ):
        mock_model_repo.get_by_id.return_value = None
        service = self._service(mock_prompt_repo, mock_model_repo)
        with pytest.raises(ModelNotFoundError):
            await service.create_prompt_version(create_data, created_by="user_1")

    async def test_activate_prompt_retires_previous(
        self, mock_prompt_repo, mock_model_repo, sample_prompt
    ):
        sample_prompt.status = PromptStatus.DRAFT
        sample_prompt.is_active = False
        service = self._service(mock_prompt_repo, mock_model_repo)
        await service.activate_prompt(sample_prompt.id)
        mock_prompt_repo.deactivate_all_for_model.assert_called_once_with(
            sample_prompt.model_id
        )
        assert sample_prompt.status == PromptStatus.ACTIVE
        assert sample_prompt.is_active is True

    async def test_activate_already_active_is_idempotent(
        self, mock_prompt_repo, mock_model_repo, sample_prompt
    ):
        sample_prompt.status = PromptStatus.ACTIVE
        sample_prompt.is_active = True
        service = self._service(mock_prompt_repo, mock_model_repo)
        result = await service.activate_prompt(sample_prompt.id)
        mock_prompt_repo.deactivate_all_for_model.assert_not_called()
        assert result.status == PromptStatus.ACTIVE

    async def test_activate_retired_prompt_raises(
        self, mock_prompt_repo, mock_model_repo, sample_prompt
    ):
        sample_prompt.status = PromptStatus.RETIRED
        service = self._service(mock_prompt_repo, mock_model_repo)
        with pytest.raises(ActivePromptImmutableError):
            await service.activate_prompt(sample_prompt.id)

    async def test_activate_not_found_raises(
        self, mock_prompt_repo, mock_model_repo
    ):
        mock_prompt_repo.get_by_id.return_value = None
        service = self._service(mock_prompt_repo, mock_model_repo)
        with pytest.raises(PromptNotFoundError):
            await service.activate_prompt(uuid.uuid4())
