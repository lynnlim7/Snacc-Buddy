from app.ai_governance.services.risk_engine.base_rule import BaseRiskRule, RuleResult


class RestaurantRule(BaseRiskRule):
    """
    Restaurant or branded food detected.

    Proprietary recipes and variable preparation methods make calorie
    estimation less reliable than equivalent home-cooked dishes.
    The model may identify the brand but cannot know the exact recipe.
    """

    def evaluate(self, context: dict) -> RuleResult:
        restaurant = context.get("restaurant_or_brand")
        if restaurant:
            return RuleResult(
                rule_name="restaurant_rule",
                score_contribution=15,
                triggered=True,
                reason=f"Restaurant/brand detected: '{restaurant}'",
            )
        return RuleResult(
            rule_name="restaurant_rule",
            score_contribution=0,
            triggered=False,
            reason="No restaurant or brand detected",
        )
