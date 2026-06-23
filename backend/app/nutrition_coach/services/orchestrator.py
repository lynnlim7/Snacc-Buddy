import asyncio
import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.nutrition_coach.models.nutrition_insight import NutritionInsight
from app.nutrition_coach.models.recipe import Recipe
from app.nutrition_coach.models.user_nutrition_summary import UserNutritionSummary
from app.nutrition_coach.repositories.nutrition_summary import NutritionSummaryRepository
from app.nutrition_coach.services.insight_engine.engine import NutritionInsightEngine
from app.nutrition_coach.services.memory import NutritionMemoryService
from app.nutrition_coach.services.retrieval import RetrievalAgent

logger = logging.getLogger(__name__)


class NutritionCoachOrchestrator:
    """Owns the two-stage orchestration boundary.

    Stage 1 (prepare): concurrent fan-out — Memory ‖ Retrieval, then
                       Insight Engine (depends on snapshot).
    Stage 2 (load):    reads the latest persisted Stage-1 outputs for the
                       RecommendationAgent to consume at chat time.

    Each agent is an independently testable class; the orchestrator owns only
    the stage boundaries and asyncio coordination.
    """

    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._memory = NutritionMemoryService(db)
        self._retrieval = RetrievalAgent(db)
        self._insight_engine = NutritionInsightEngine()
        self._repo = NutritionSummaryRepository(db)

    async def prepare(self, user: User) -> tuple[UserNutritionSummary, NutritionInsight, list[Recipe]]:
        """Stage 1 — concurrent fan-out triggered on every meal log.

        Parallelism:
          A. NutritionMemoryService.build_snapshot  — no AI
          C. RetrievalAgent.retrieve                — Gemini embed (1 call)

        B. NutritionInsightEngine.evaluate runs after A (needs the snapshot).

        Persistence: snapshot → insight → candidate set all written before returning.
        """
        # Run memory-build and retrieval concurrently (they're independent)
        snapshot_task = asyncio.create_task(self._memory.build_snapshot(user))
        retrieval_task = asyncio.create_task(
            self._retrieval.retrieve(user, snapshot=None)
        )

        snapshot, top10 = await asyncio.gather(snapshot_task, retrieval_task)

        # Insight engine is synchronous — depends on the snapshot
        evaluation = self._insight_engine.evaluate(snapshot)
        insight_model = self._insight_engine.to_db_model(
            evaluation, user_id=str(user.id), summary_id=snapshot.id
        )
        insight = await self._repo.save_insight(insight_model)
        await self._db.commit()

        logger.info(
            "orchestrator.prepare user=%s snapshot=%s insights_triggered=%d recipes=%d",
            user.id,
            snapshot.id,
            len(evaluation.triggered_rules),
            len(top10),
        )
        return snapshot, insight, top10

    async def load_stage1(
        self, user_id: str
    ) -> tuple[UserNutritionSummary | None, NutritionInsight | None, list[Recipe]]:
        """Stage 2 read — fetches the latest persisted Stage-1 outputs.

        Called at chat time so the RecommendationAgent has pre-computed context.
        Returns (None, None, []) if no prepared set exists yet — the chat route
        falls back to basic context in that case.
        """
        summary = await self._repo.get_latest_summary(user_id)
        insight = await self._repo.get_latest_insight(user_id) if summary else None
        return summary, insight, []  # top-10 recipes not persisted yet — deferred
