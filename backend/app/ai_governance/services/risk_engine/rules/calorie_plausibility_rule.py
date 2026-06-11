from app.ai_governance.services.risk_engine.base_rule import BaseRiskRule, RuleResult

# Physiologically plausible bounds for a single meal serving.
# Values outside this range indicate likely hallucination or parsing failure.
_MIN_PLAUSIBLE_KCAL = 50
_MAX_PLAUSIBLE_KCAL = 5000


class CaloriePlausibilityRule(BaseRiskRule):
    """
    Guards against hallucinated calorie values outside physiologically
    plausible bounds for a single meal.

    Extreme values (< 50 kcal or > 5000 kcal) almost certainly indicate
    a model error rather than a real food item, and carry significant
    downstream impact on nutrition tracking accuracy.
    """

    def evaluate(self, context: dict) -> RuleResult:
        calories = context.get("estimated_total_calories") or 0
        try:
            calories = int(calories)
        except (TypeError, ValueError):
            calories = 0

        if calories < _MIN_PLAUSIBLE_KCAL or calories > _MAX_PLAUSIBLE_KCAL:
            return RuleResult(
                rule_name="calorie_plausibility_rule",
                score_contribution=35,
                triggered=True,
                reason=(
                    f"Implausible calorie estimate: {calories} kcal "
                    f"(expected {_MIN_PLAUSIBLE_KCAL}–{_MAX_PLAUSIBLE_KCAL} kcal)"
                ),
            )
        return RuleResult(
            rule_name="calorie_plausibility_rule",
            score_contribution=0,
            triggered=False,
            reason=f"Calorie estimate within plausible range: {calories} kcal",
        )
