import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai_governance.services.inference_audit import InferenceAuditService
from app.models.user import User
from app.nutrition_coach.models.recipe import Recipe
from app.nutrition_coach.models.user_nutrition_summary import UserNutritionSummary
from app.nutrition_coach.repositories.recipe import RecipeRepository
from app.nutrition_coach.utils.nutrition import compute_nutrition_targets
from app.prompt.gemini import gemini_service

logger = logging.getLogger(__name__)


def _build_retrieval_query(user: User, snapshot: UserNutritionSummary | None) -> str:
    """Build a natural-language embedding query from the user's statistics.

    Driven by user goals, dietary restrictions, conditions, and current intake —
    independent of the NutritionInsightEngine so it can run concurrently (Stage 1C).
    """
    parts: list[str] = []

    if user.goal:
        parts.append(f"Goal: {user.goal}")
    if user.dietary_restrictions and user.condition_type:
        parts.append(f"Dietary needs: {user.condition_type}")
    if user.medical_conditions and user.condition_type:
        parts.append(f"Medical conditions: {user.condition_type}")

    targets = compute_nutrition_targets(
        gender=user.gender,
        age=user.age,
        height_cm=user.height_cm,
        weight_kg=user.current_weight_kg,
        lifestyle=user.lifestyle,
    )
    parts.append(f"Daily calorie target: {targets.calories:.0f} kcal")
    parts.append(f"Daily protein target: {targets.protein_g:.0f} g")

    if snapshot:
        if snapshot.avg_calories_7d is not None:
            remaining = max(0.0, targets.calories - snapshot.avg_calories_7d)
            parts.append(f"Remaining calorie budget: {remaining:.0f} kcal")

    query = (
        "Healthy recipe recommendation for a person with the following profile. "
        + " | ".join(parts)
    )
    return query


class RetrievalAgent:
    """Stage 1C — Hybrid retrieval pipeline.

    Funnel: query builder → Gemini embed → pgvector top-50 → metadata filter top-30
            → nutrition scoring top-10.

    The embedding call is the only AI cost here; steps 3-5 are pure SQL/Python.
    The agent knows nothing about NutritionInsightEngine; query building uses only
    user statistics so it can run concurrently with the memory agent.
    """

    def __init__(self, db: AsyncSession) -> None:
        self._recipe_repo = RecipeRepository(db)

    async def retrieve(
        self,
        user: User,
        snapshot: UserNutritionSummary | None = None,
    ) -> list[Recipe]:
        recipe_count = await self._recipe_repo.count()
        if recipe_count == 0:
            logger.info("retrieval_agent.retrieve: recipe table empty — skipping")
            return []

        query_text = _build_retrieval_query(user, snapshot)
        logger.info("retrieval_agent.retrieve query=%r", query_text[:80])

        embedding = await gemini_service.embed_text(query_text)

        # Step 3: semantic top-50
        semantic_results = await self._recipe_repo.semantic_search(embedding)
        if not semantic_results:
            return []

        targets = compute_nutrition_targets(
            gender=user.gender,
            age=user.age,
            height_cm=user.height_cm,
            weight_kg=user.current_weight_kg,
            lifestyle=user.lifestyle,
        )
        calorie_remaining = (
            max(0.0, targets.calories - (snapshot.avg_calories_7d or 0.0))
            if snapshot
            else targets.calories
        )

        # Step 4: metadata filter → top-30
        filtered = self._recipe_repo.metadata_filter(
            candidates=semantic_results,
            diet_restrictions=bool(user.dietary_restrictions),
            condition_type=user.condition_type,
            calorie_ceiling=calorie_remaining * 1.2 if calorie_remaining else None,
        )

        # Step 5: nutrition scoring → top-10
        top10 = self._recipe_repo.score_recipes(
            candidates=filtered,
            protein_target_g=targets.protein_g,
            calorie_remaining=calorie_remaining,
        )

        logger.info(
            "retrieval_agent.retrieve semantic=%d filtered=%d scored=%d",
            len(semantic_results),
            len(filtered),
            len(top10),
        )
        return top10
