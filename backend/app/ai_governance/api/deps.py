from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.ai_governance.repositories.model_registry import ModelRegistryRepository
from app.ai_governance.repositories.prompt_registry import PromptRegistryRepository
from app.ai_governance.repositories.inference_log import InferenceLogRepository
from app.ai_governance.repositories.risk_assessment import RiskAssessmentRepository
from app.ai_governance.repositories.human_review import HumanReviewRepository
from app.ai_governance.services.model_registry import ModelRegistryService
from app.ai_governance.services.prompt_registry import PromptRegistryService
from app.ai_governance.services.inference_audit import InferenceAuditService
from app.ai_governance.services.human_review import HumanReviewService
from app.ai_governance.dashboards.aggregations import GovernanceDashboardAggregator


def get_model_registry_service(
    db: AsyncSession = Depends(get_db),
) -> ModelRegistryService:
    return ModelRegistryService(ModelRegistryRepository(db))


def get_prompt_registry_service(
    db: AsyncSession = Depends(get_db),
) -> PromptRegistryService:
    return PromptRegistryService(
        PromptRegistryRepository(db),
        ModelRegistryRepository(db),
    )


def get_inference_audit_service(
    db: AsyncSession = Depends(get_db),
) -> InferenceAuditService:
    return InferenceAuditService(db)


def get_human_review_service(
    db: AsyncSession = Depends(get_db),
) -> HumanReviewService:
    return HumanReviewService(
        HumanReviewRepository(db),
        InferenceLogRepository(db),
    )


def get_dashboard_aggregator(
    db: AsyncSession = Depends(get_db),
) -> GovernanceDashboardAggregator:
    return GovernanceDashboardAggregator(db)
