from app.ai_governance.services.risk_engine.base_rule import BaseRiskRule, RuleResult

_LOW_CONFIDENCE_THRESHOLD = 0.5
_HIGH_UNCERTAIN_RATIO = 0.5  # >50% low-confidence ingredients triggers rule


class IngredientUncertaintyRule(BaseRiskRule):
    """
    Evaluates per-ingredient confidence scores to detect
    systemic uncertainty across the identified ingredients.

    A dish where the majority of ingredients have low confidence
    scores is inherently unreliable even if the overall confidence
    is moderate — the aggregate may mask individual failures.
    """

    def evaluate(self, context: dict) -> RuleResult:
        ingredients: list[dict] = context.get("ingredients") or []

        if not ingredients:
            return RuleResult(
                rule_name="ingredient_uncertainty_rule",
                score_contribution=0,
                triggered=False,
                reason="No ingredients to evaluate",
            )

        low_confidence_count = sum(
            1
            for ing in ingredients
            if isinstance(ing, dict)
            and (ing.get("confidence") or 1.0) < _LOW_CONFIDENCE_THRESHOLD
        )
        ratio = low_confidence_count / len(ingredients)

        if ratio > _HIGH_UNCERTAIN_RATIO:
            return RuleResult(
                rule_name="ingredient_uncertainty_rule",
                score_contribution=15,
                triggered=True,
                reason=(
                    f"{low_confidence_count}/{len(ingredients)} ingredients "
                    f"have confidence < {_LOW_CONFIDENCE_THRESHOLD} "
                    f"({ratio:.0%} uncertain)"
                ),
            )
        return RuleResult(
            rule_name="ingredient_uncertainty_rule",
            score_contribution=0,
            triggered=False,
            reason=(
                f"Ingredient confidence acceptable: "
                f"{low_confidence_count}/{len(ingredients)} low-confidence"
            ),
        )
