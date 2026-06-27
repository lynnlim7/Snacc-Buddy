import json
import logging

from app.core.exceptions import AIException
from app.nutrition_coach.models.nutrition_insight import NutritionInsight
from app.nutrition_coach.models.recipe import Recipe
from app.nutrition_coach.models.user_nutrition_summary import UserNutritionSummary
from app.prompt.gemini import gemini_service
from app.schemas.coach import CoachChatResponse, CoachMessage

logger = logging.getLogger(__name__)


def _build_coaching_context(
    snapshot: UserNutritionSummary | None,
    insight: NutritionInsight | None,
    top10: list[Recipe],
) -> str:
    """Serialise Stage-1 outputs into a structured context block for the LLM.

    This is injected as ground truth so the recommendation is grounded in the
    user's actual data rather than generic advice.
    """
    ctx: dict = {}

    if snapshot:
        ctx["nutrition_averages_7d"] = {
            "calories": snapshot.avg_calories_7d,
            "protein_g": snapshot.avg_protein_g_7d,
            "carbs_g": snapshot.avg_carbs_g_7d,
            "fat_g": snapshot.avg_fat_g_7d,
            "fibre_g": snapshot.avg_fibre_g_7d,
        }
        ctx["targets"] = {
            "calories": snapshot.calorie_target,
            "protein_g": snapshot.protein_target_g,
            "carbs_g": snapshot.carbs_target_g,
            "fat_g": snapshot.fat_target_g,
        }

    if insight:
        ctx["active_insights"] = {
            "protein_deficit": insight.protein_deficit,
            "fibre_deficit": insight.fibre_deficit,
            "excess_sodium": insight.excess_sodium,
            "calorie_surplus": insight.calorie_surplus,
            "low_meal_consistency": insight.low_meal_consistency,
            "protein_adherence_pct": insight.protein_adherence_pct,
            "calorie_adherence_pct": insight.calorie_adherence_pct,
        }

    if top10:
        ctx["retrieved_recipes"] = [
            {
                "recipe_id": str(r.id),
                "title": r.title,
                "calories": r.calories,
                "protein_g": r.protein_g,
                "carbs_g": r.carbs_g,
                "fat_g": r.fat_g,
                "fibre_g": r.fibre_g,
                "sodium_mg": r.sodium_mg,
                "diet_tags": r.diet_tags,
                "time_minutes": r.time_minutes,
            }
            for r in top10
        ]
    else:
        ctx["retrieved_recipes"] = []
        ctx["recipe_note"] = (
            "No recipes are in the database yet — provide general suggestions "
            "grounded in the user's nutritional data above."
        )

    return json.dumps(ctx, default=str, indent=2)


class RecommendationAgent:
    """Stage 2 — synthesises snapshot + insights + top-10 into a personalised reply.

    Every call passes through the governance audit envelope in the calling route.
    The agent itself is a pure service: no DB access, no audit logic.
    """

    async def recommend(
        self,
        snapshot: UserNutritionSummary | None,
        insight: NutritionInsight | None,
        top10: list[Recipe],
        messages: list[CoachMessage],
        user_context: dict,
    ) -> CoachChatResponse:
        """Build an enriched context from Stage-1 outputs and call the coach LLM.

        The `user_context` (profile + today's totals + recent meals) from the route
        is merged with the richer Stage-1 data so the LLM has both real-time and
        historical signals.
        """
        stage1_context = _build_coaching_context(snapshot, insight, top10)

        enriched_context = {
            **user_context,
            "nutrition_coach_data": json.loads(stage1_context),
        }

        msg_dicts = [{"role": m.role, "content": m.content} for m in messages]
        result = await gemini_service.coach_chat(enriched_context, msg_dicts)

        logger.info(
            "recommendation_agent.recommend in_scope=%s recipes=%d",
            result.in_scope,
            len(result.recipes),
        )
        return result
