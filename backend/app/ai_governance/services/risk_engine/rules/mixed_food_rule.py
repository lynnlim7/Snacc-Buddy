from app.ai_governance.services.risk_engine.base_rule import BaseRiskRule, RuleResult

_HIGH_INGREDIENT_COUNT = 8  # proxy for dish complexity


class MixedFoodRule(BaseRiskRule):
    """
    Detects mixed or composite dishes where per-ingredient calorie
    estimation is unreliable.

    Signals:
    - ambiguity_flags containing 'hidden_ingredients' or 'unclear_portion_size'
    - More than 8 distinct ingredients (proxy for complexity/combination dishes)
    """

    def evaluate(self, context: dict) -> RuleResult:
        flags: list[str] = context.get("ambiguity_flags") or []
        ingredients: list = context.get("ingredients") or []

        has_hidden = "hidden_ingredients" in flags
        has_unclear_portion = "unclear_portion_size" in flags
        too_many_ingredients = len(ingredients) > _HIGH_INGREDIENT_COUNT

        if has_hidden or has_unclear_portion or too_many_ingredients:
            reasons = []
            if has_hidden:
                reasons.append("hidden_ingredients flag present")
            if has_unclear_portion:
                reasons.append("unclear_portion_size flag present")
            if too_many_ingredients:
                reasons.append(
                    f"high ingredient count: {len(ingredients)} "
                    f"(threshold: {_HIGH_INGREDIENT_COUNT})"
                )
            return RuleResult(
                rule_name="mixed_food_rule",
                score_contribution=20,
                triggered=True,
                reason=f"Mixed/complex dish: {'; '.join(reasons)}",
            )

        return RuleResult(
            rule_name="mixed_food_rule",
            score_contribution=0,
            triggered=False,
            reason="No mixed-food signals detected",
        )
