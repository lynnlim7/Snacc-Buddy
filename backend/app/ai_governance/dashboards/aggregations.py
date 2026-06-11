from datetime import datetime

from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai_governance.enums.model_enums import ModelStatus, RiskTier
from app.ai_governance.enums.prompt_enums import PromptStatus
from app.ai_governance.enums.review_enums import ReviewDecision
from app.ai_governance.models.ai_model import AIModel
from app.ai_governance.models.human_review import HumanReview
from app.ai_governance.models.inference_log import AIInferenceLog
from app.ai_governance.models.prompt_version import PromptVersion


class GovernanceDashboardAggregator:
    """
    SQL-level aggregation for the governance dashboard.

    Design principles:
    - Single-query KPI aggregation avoids N+1 problems.
    - date_trunc bucketing for time-series charts is done in the DB,
      not in Python, to support large inference volumes.
    - valid_flag float storage enables direct AVG/SUM rate calculations.
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_kpis(self, since: datetime, until: datetime) -> dict:
        """
        Aggregates all KPI metrics in two queries (inferences + reviews),
        plus two count queries for active models and prompts.
        """
        # Inference KPIs
        inf_q = select(
            func.count(AIInferenceLog.id).label("total_inferences"),
            func.coalesce(func.avg(AIInferenceLog.confidence_score), 0).label("avg_confidence"),
            func.coalesce(
                func.sum(
                    case((AIInferenceLog.risk_level == RiskTier.HIGH, 1), else_=0)
                ),
                0,
            ).label("high_risk_count"),
        ).where(
            AIInferenceLog.created_at >= since,
            AIInferenceLog.created_at <= until,
        )
        inf_result = (await self.db.execute(inf_q)).one()

        # Review KPIs — valid_flag float enables direct rate calculation
        rev_q = select(
            func.count(HumanReview.id).label("total_reviews"),
            func.coalesce(
                func.sum(case((HumanReview.valid_flag == ReviewDecision.APPROVED.value, 1), else_=0)),
                0,
            ).label("approved"),
            func.coalesce(
                func.sum(
                    case(
                        (HumanReview.valid_flag == ReviewDecision.REVIEW_REQUIRED.value, 1),
                        else_=0,
                    )
                ),
                0,
            ).label("review_required"),
            func.coalesce(
                func.sum(case((HumanReview.valid_flag == ReviewDecision.REJECTED.value, 1), else_=0)),
                0,
            ).label("rejected"),
        ).where(
            HumanReview.created_at >= since,
            HumanReview.created_at <= until,
        )
        rev_result = (await self.db.execute(rev_q)).one()

        active_models = (
            await self.db.execute(
                select(func.count(AIModel.id)).where(AIModel.status == ModelStatus.ACTIVE)
            )
        ).scalar_one()

        active_prompts = (
            await self.db.execute(
                select(func.count(PromptVersion.id)).where(PromptVersion.is_active == True)
            )
        ).scalar_one()

        total_reviews = max(int(rev_result.total_reviews), 1)  # avoid division by zero
        return {
            "total_inferences": int(inf_result.total_inferences),
            "avg_confidence": round(float(inf_result.avg_confidence), 3),
            "high_risk_inferences": int(inf_result.high_risk_count),
            "total_reviews": int(rev_result.total_reviews),
            "approval_rate": round(int(rev_result.approved) / total_reviews, 3),
            "review_rate": round(int(rev_result.review_required) / total_reviews, 3),
            "rejection_rate": round(int(rev_result.rejected) / total_reviews, 3),
            "active_models": int(active_models),
            "active_prompts": int(active_prompts),
        }

    async def get_confidence_trend(
        self,
        since: datetime,
        until: datetime,
        bucket: str = "day",
    ) -> list[dict]:
        """
        Returns bucketed (hourly/daily) average confidence and inference count.
        Used to render the confidence trend line chart.
        """
        q = (
            select(
                func.date_trunc(bucket, AIInferenceLog.created_at).label("period"),
                func.coalesce(func.avg(AIInferenceLog.confidence_score), 0).label("avg_confidence"),
                func.count(AIInferenceLog.id).label("inference_count"),
            )
            .where(
                AIInferenceLog.created_at >= since,
                AIInferenceLog.created_at <= until,
            )
            .group_by("period")
            .order_by("period")
        )
        rows = (await self.db.execute(q)).all()
        return [
            {
                "period": r.period.isoformat(),
                "avg_confidence": round(float(r.avg_confidence), 3),
                "inference_count": int(r.inference_count),
            }
            for r in rows
        ]

    async def get_risk_distribution(
        self, since: datetime, until: datetime
    ) -> dict[str, int]:
        """
        Returns count of inferences per risk tier.
        Used to render the risk distribution bar/pie chart.
        """
        q = (
            select(
                AIInferenceLog.risk_level,
                func.count(AIInferenceLog.id).label("count"),
            )
            .where(
                AIInferenceLog.created_at >= since,
                AIInferenceLog.created_at <= until,
                AIInferenceLog.risk_level.isnot(None),
            )
            .group_by(AIInferenceLog.risk_level)
        )
        rows = (await self.db.execute(q)).all()
        result = {"low": 0, "medium": 0, "high": 0}
        for r in rows:
            if r.risk_level:
                result[r.risk_level.value] = int(r.count)
        return result

    async def get_review_outcomes(
        self, since: datetime, until: datetime
    ) -> dict[str, int]:
        """
        Returns approved/review_required/rejected counts.
        Used to render the human review outcomes donut chart.
        """
        q = select(
            func.coalesce(
                func.sum(case((HumanReview.valid_flag == ReviewDecision.APPROVED.value, 1), else_=0)),
                0,
            ).label("approved"),
            func.coalesce(
                func.sum(
                    case(
                        (HumanReview.valid_flag == ReviewDecision.REVIEW_REQUIRED.value, 1),
                        else_=0,
                    )
                ),
                0,
            ).label("review_required"),
            func.coalesce(
                func.sum(case((HumanReview.valid_flag == ReviewDecision.REJECTED.value, 1), else_=0)),
                0,
            ).label("rejected"),
            func.count(HumanReview.id).label("total"),
        ).where(
            HumanReview.created_at >= since,
            HumanReview.created_at <= until,
        )
        row = (await self.db.execute(q)).one()
        return {
            "approved": int(row.approved),
            "review_required": int(row.review_required),
            "rejected": int(row.rejected),
            "total": int(row.total),
        }
