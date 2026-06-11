from datetime import datetime
from uuid import UUID

from sqlalchemy import func, select

from app.ai_governance.enums.model_enums import RiskTier
from app.ai_governance.models.inference_log import AIInferenceLog
from app.ai_governance.repositories.base import BaseRepository


class InferenceLogRepository(BaseRepository[AIInferenceLog]):
    model = AIInferenceLog

    async def get_by_food_log(self, food_log_id: UUID) -> AIInferenceLog | None:
        q = select(AIInferenceLog).where(
            AIInferenceLog.food_log_id == food_log_id
        )
        return (await self.db.execute(q)).scalar_one_or_none()

    async def get_recent(
        self,
        model_id: UUID | None = None,
        risk_level: RiskTier | None = None,
        since: datetime | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[AIInferenceLog], int]:
        q = select(AIInferenceLog)
        if model_id is not None:
            q = q.where(AIInferenceLog.model_id == model_id)
        if risk_level is not None:
            q = q.where(AIInferenceLog.risk_level == risk_level)
        if since is not None:
            q = q.where(AIInferenceLog.created_at >= since)

        count = (
            await self.db.execute(select(func.count()).select_from(q.subquery()))
        ).scalar_one()
        rows = (
            await self.db.execute(
                q.order_by(AIInferenceLog.created_at.desc()).limit(limit).offset(offset)
            )
        ).scalars().all()
        return list(rows), count

    async def avg_confidence(self, since: datetime | None = None) -> float:
        q = select(func.avg(AIInferenceLog.confidence_score))
        if since is not None:
            q = q.where(AIInferenceLog.created_at >= since)
        result = (await self.db.execute(q)).scalar_one()
        return float(result or 0.0)
