from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import joinedload

from app.ai_governance.enums.model_enums import RiskTier
from app.ai_governance.enums.review_enums import ReviewDecision
from app.ai_governance.models.human_review import HumanReview
from app.ai_governance.models.inference_log import AIInferenceLog
from app.ai_governance.repositories.base import BaseRepository


class HumanReviewRepository(BaseRepository[HumanReview]):
    model = HumanReview

    async def get_by_inference_id(self, inference_id: UUID) -> HumanReview | None:
        q = select(HumanReview).where(HumanReview.inference_id == inference_id)
        return (await self.db.execute(q)).scalar_one_or_none()

    async def get_unreviewed_high_risk(
        self, limit: int = 20, offset: int = 0
    ) -> tuple[list[AIInferenceLog], int]:
        """
        Returns HIGH risk inference logs that have no human review yet.
        Used to populate the pending review queue for human reviewers.
        """
        reviewed_ids_q = select(HumanReview.inference_id)
        q = select(AIInferenceLog).where(
            AIInferenceLog.risk_level == RiskTier.HIGH,
            AIInferenceLog.id.not_in(reviewed_ids_q),
        ).order_by(AIInferenceLog.created_at.desc())

        count = (
            await self.db.execute(select(func.count()).select_from(q.subquery()))
        ).scalar_one()
        rows = (
            await self.db.execute(q.limit(limit).offset(offset))
        ).scalars().all()
        return list(rows), count

    async def get_review_outcome_counts(
        self, since=None, until=None
    ) -> dict[str, int]:
        q = select(
            func.sum(
                func.case((HumanReview.valid_flag == ReviewDecision.APPROVED.value, 1), else_=0)
            ).label("approved"),
            func.sum(
                func.case(
                    (HumanReview.valid_flag == ReviewDecision.REVIEW_REQUIRED.value, 1), else_=0
                )
            ).label("review_required"),
            func.sum(
                func.case((HumanReview.valid_flag == ReviewDecision.REJECTED.value, 1), else_=0)
            ).label("rejected"),
            func.count(HumanReview.id).label("total"),
        )
        if since:
            q = q.where(HumanReview.created_at >= since)
        if until:
            q = q.where(HumanReview.created_at <= until)
        row = (await self.db.execute(q)).one()
        return {
            "approved": int(row.approved or 0),
            "review_required": int(row.review_required or 0),
            "rejected": int(row.rejected or 0),
            "total": int(row.total or 0),
        }
