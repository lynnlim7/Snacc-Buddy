from app.nutrition_coach.services.insight_engine.base_rule import BaseInsightRule, InsightResult

# Food logs store sodium in grams; 2.3 g/day = 2300 mg WHO/AHA upper limit
_SODIUM_CEILING_G = 2.3


class ExcessSodiumRule(BaseInsightRule):
    def evaluate(self, snapshot: dict) -> InsightResult:
        avg_g = snapshot.get("avg_sodium_g_7d", 0.0) or 0.0
        return InsightResult(
            rule_name="excess_sodium",
            triggered=avg_g > _SODIUM_CEILING_G,
            value=avg_g,
            threshold=_SODIUM_CEILING_G,
        )
