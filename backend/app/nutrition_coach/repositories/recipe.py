from dataclasses import dataclass

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.nutrition_coach.models.recipe import Recipe


@dataclass
class ScoredRecipe:
    recipe: Recipe
    score: float


class RecipeRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def semantic_search(self, embedding: list[float]) -> list[Recipe]:
        """Cosine-distance HNSW search — broad semantic recall (TOP_SEMANTIC results)."""
        if not embedding:
            return []
        embedding_str = "[" + ",".join(str(v) for v in embedding) + "]"
        q = (
            select(Recipe)
            .where(Recipe.embedding_vector.is_not(None))
            .order_by(text(f"embedding_vector <=> '{embedding_str}'::vector"))
            .limit(settings.RETRIEVAL_TOP_SEMANTIC)
        )
        rows = (await self.db.execute(q)).scalars().all()
        return list(rows)

    def metadata_filter(
        self,
        candidates: list[Recipe],
        diet_restrictions: bool,
        condition_type: str | None,
        calorie_ceiling: float | None,
    ) -> list[Recipe]:
        """Apply hard constraints on the candidate set (Python-side).

        Hard constraints:
          - calorie ceiling from remaining daily budget
          - dietary/condition tags (hypertension → low-sodium, diabetes → low-gi/low-carb)
        """
        result: list[Recipe] = []
        for r in candidates:
            if calorie_ceiling and r.calories and r.calories > calorie_ceiling:
                continue
            if diet_restrictions and condition_type:
                condition_lower = condition_type.lower()
                tags = [t.lower() for t in (r.diet_tags or [])]
                if "hypertension" in condition_lower and "low-sodium" not in tags:
                    continue
                if "diabetes" in condition_lower and "low-gi" not in tags and "low-carb" not in tags:
                    continue
            result.append(r)
            if len(result) >= settings.RETRIEVAL_TOP_FILTERED:
                break
        return result

    def score_recipes(
        self,
        candidates: list[Recipe],
        protein_target_g: float,
        calorie_remaining: float,
    ) -> list[Recipe]:
        """Rank by nutritional fit; return top RETRIEVAL_TOP_SCORED.

        Scoring (positive = desired, negative = penalised):
          + protein density toward target     weight 30
          + fibre content                     weight 15
          − excess sodium (>500 mg/serving)   weight −1/100 mg
          + calorie proximity to budget       weight 20
        """
        scored: list[ScoredRecipe] = []
        for r in candidates:
            score = 0.0
            if r.protein_g and protein_target_g:
                score += min(r.protein_g / protein_target_g, 1.0) * 30.0
            if r.fibre_g:
                score += min(r.fibre_g / 10.0, 1.0) * 15.0
            if r.sodium_mg and r.sodium_mg > 500:
                score -= (r.sodium_mg - 500) / 100.0
            if r.calories and calorie_remaining > 0:
                score += max(0.0, 20.0 - abs(r.calories - calorie_remaining) / 10.0)
            scored.append(ScoredRecipe(recipe=r, score=score))

        scored.sort(key=lambda s: s.score, reverse=True)
        return [s.recipe for s in scored[: settings.RETRIEVAL_TOP_SCORED]]

    async def count(self) -> int:
        result = await self.db.execute(text("SELECT COUNT(*) FROM recipes"))
        return result.scalar_one()
