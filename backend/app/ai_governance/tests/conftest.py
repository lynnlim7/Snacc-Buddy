"""
Governance test fixtures.

Uses pytest-asyncio with SQLite in-memory for speed.
The async session fixture mirrors the production async pattern.
"""
import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.ai_governance.enums.model_enums import ModelProvider, ModelStatus, RiskTier
from app.ai_governance.enums.prompt_enums import PromptStatus
from app.ai_governance.enums.review_enums import ReviewDecision
from app.ai_governance.models.ai_model import AIModel
from app.ai_governance.models.human_review import HumanReview
from app.ai_governance.models.inference_log import AIInferenceLog
from app.ai_governance.models.prompt_version import PromptVersion
from app.ai_governance.models.risk_assessment import RiskAssessment
from app.ai_governance.services.risk_engine.engine import RiskAssessmentEngine


# ── Shared fixtures ───────────────────────────────────────────────────────────

@pytest.fixture
def risk_engine() -> RiskAssessmentEngine:
    return RiskAssessmentEngine()


@pytest.fixture
def model_id() -> uuid.UUID:
    return uuid.uuid4()


@pytest.fixture
def prompt_id() -> uuid.UUID:
    return uuid.uuid4()


@pytest.fixture
def inference_id() -> uuid.UUID:
    return uuid.uuid4()


@pytest.fixture
def sample_ai_model(model_id) -> AIModel:
    model = MagicMock(spec=AIModel)
    model.id = model_id
    model.name = "Gemini Flash"
    model.provider = ModelProvider.GOOGLE
    model.model_identifier = "gemini-2.0-flash"
    model.version = "2.0"
    model.status = ModelStatus.ACTIVE
    model.is_default = True
    model.risk_tier = RiskTier.MEDIUM
    return model


@pytest.fixture
def sample_prompt(prompt_id, model_id) -> PromptVersion:
    prompt = MagicMock(spec=PromptVersion)
    prompt.id = prompt_id
    prompt.model_id = model_id
    prompt.version = 1
    prompt.name = "v1 food analysis"
    prompt.prompt_template = "Analyse the food."
    prompt.content_hash = "abc123" * 10 + "abcd"  # 64 chars
    prompt.status = PromptStatus.DRAFT
    prompt.is_active = False
    return prompt


@pytest.fixture
def sample_inference_log(inference_id, model_id, prompt_id) -> AIInferenceLog:
    log = MagicMock(spec=AIInferenceLog)
    log.id = inference_id
    log.model_id = model_id
    log.prompt_version_id = prompt_id
    log.confidence_score = 0.85
    log.risk_level = RiskTier.LOW
    log.response_payload = {}
    return log


# ── Repository mocks ──────────────────────────────────────────────────────────

@pytest.fixture
def mock_model_repo(sample_ai_model):
    repo = AsyncMock()
    repo.get_by_id.return_value = sample_ai_model
    repo.get_default_model.return_value = sample_ai_model
    repo.get_by_identifier_and_version.return_value = None
    repo.clear_default_flag.return_value = None
    repo.create.side_effect = lambda m: m
    repo.update.side_effect = lambda m: m
    return repo


@pytest.fixture
def mock_prompt_repo(sample_prompt, model_id):
    repo = AsyncMock()
    repo.get_by_id.return_value = sample_prompt
    repo.get_active_prompt_for_model.return_value = None
    repo.get_next_version_number.return_value = 1
    repo.deactivate_all_for_model.return_value = None
    repo.create.side_effect = lambda p: p
    repo.update.side_effect = lambda p: p
    return repo


@pytest.fixture
def mock_log_repo(sample_inference_log):
    repo = AsyncMock()
    repo.get_by_id.return_value = sample_inference_log
    repo.create.side_effect = lambda l: l
    repo.update.side_effect = lambda l: l
    return repo


@pytest.fixture
def mock_risk_repo():
    repo = AsyncMock()
    repo.get_by_inference_id.return_value = None
    repo.create.side_effect = lambda r: r
    return repo


@pytest.fixture
def mock_review_repo():
    repo = AsyncMock()
    repo.get_by_inference_id.return_value = None
    repo.create.side_effect = lambda r: r
    return repo
