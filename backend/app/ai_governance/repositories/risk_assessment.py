from uuid import UUID

from sqlalchemy import select

from app.ai_governance.models.risk_assessment import RiskAssessment
from app.ai_governance.repositories.base import BaseRepository


class RiskAssessmentRepository(BaseRepository[RiskAssessment]):
    model = RiskAssessment

    async def get_by_inference_id(self, inference_id: UUID) -> RiskAssessment | None:
        q = select(RiskAssessment).where(RiskAssessment.inference_id == inference_id)
        return (await self.db.execute(q)).scalar_one_or_none()
