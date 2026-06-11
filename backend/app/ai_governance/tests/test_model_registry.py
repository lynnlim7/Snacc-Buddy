"""
Unit tests for ModelRegistryService.
All repository calls are mocked — no database required.
"""
import uuid

import pytest

from app.ai_governance.enums.model_enums import ModelProvider, ModelStatus, RiskTier
from app.ai_governance.exceptions.governance_exceptions import (
    ModelIdentifierConflictError,
    ModelNotFoundError,
    RetiredModelCannotBeDefaultError,
)
from app.ai_governance.schemas.ai_model import AIModelCreate
from app.ai_governance.services.model_registry import ModelRegistryService


@pytest.fixture
def create_data():
    return AIModelCreate(
        name="Gemini Flash",
        provider=ModelProvider.GOOGLE,
        model_identifier="gemini-2.0-flash",
        version="2.0",
        capabilities=["vision", "nutrition_analysis"],
        risk_tier=RiskTier.MEDIUM,
    )


class TestModelRegistryService:
    def _service(self, mock_model_repo) -> ModelRegistryService:
        return ModelRegistryService(mock_model_repo)

    async def test_create_model_success(self, mock_model_repo, create_data):
        service = self._service(mock_model_repo)
        result = await service.create_model(create_data, created_by="user_1")
        mock_model_repo.create.assert_called_once()
        created = mock_model_repo.create.call_args[0][0]
        assert created.model_identifier == "gemini-2.0-flash"
        assert created.created_by == "user_1"

    async def test_create_model_conflict_raises(self, mock_model_repo, create_data, sample_ai_model):
        mock_model_repo.get_by_identifier_and_version.return_value = sample_ai_model
        service = self._service(mock_model_repo)
        with pytest.raises(ModelIdentifierConflictError):
            await service.create_model(create_data, created_by="user_1")

    async def test_set_default_model_clears_previous(self, mock_model_repo, sample_ai_model):
        sample_ai_model.status = ModelStatus.ACTIVE
        service = self._service(mock_model_repo)
        await service.set_default_model(sample_ai_model.id)
        mock_model_repo.clear_default_flag.assert_called_once()
        assert sample_ai_model.is_default is True

    async def test_set_default_retired_model_raises(self, mock_model_repo, sample_ai_model):
        sample_ai_model.status = ModelStatus.RETIRED
        service = self._service(mock_model_repo)
        with pytest.raises(RetiredModelCannotBeDefaultError):
            await service.set_default_model(sample_ai_model.id)

    async def test_set_default_not_found_raises(self, mock_model_repo):
        mock_model_repo.get_by_id.return_value = None
        service = self._service(mock_model_repo)
        with pytest.raises(ModelNotFoundError):
            await service.set_default_model(uuid.uuid4())

    async def test_retire_model_success(self, mock_model_repo, sample_ai_model):
        sample_ai_model.is_default = False
        service = self._service(mock_model_repo)
        await service.retire_model(sample_ai_model.id)
        assert sample_ai_model.status == ModelStatus.RETIRED
        assert sample_ai_model.is_default is False

    async def test_retire_default_model_raises(self, mock_model_repo, sample_ai_model):
        sample_ai_model.is_default = True
        service = self._service(mock_model_repo)
        with pytest.raises(ValueError, match="Cannot retire the default model"):
            await service.retire_model(sample_ai_model.id)

    async def test_get_model_not_found_raises(self, mock_model_repo):
        mock_model_repo.get_by_id.return_value = None
        service = self._service(mock_model_repo)
        with pytest.raises(ModelNotFoundError):
            await service.get_model(uuid.uuid4())
