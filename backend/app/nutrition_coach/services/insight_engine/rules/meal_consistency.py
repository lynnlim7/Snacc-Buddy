from app.nutrition_coach.services.insight_engine.base_rule import BaseInsightRule, InsightResult

# Flagged when fewer than 4 of the last 7 days had a logged meal
_MIN_FREQUENCY = 4 / 7


class MealConsistencyRule(BaseInsightRule):
    def evaluate(self, snapshot: dict) -> InsightResult:
        freq = snapshot.get("logging_frequency_7d", 0.0) or 0.0
        return InsightResult(
            rule_name="low_meal_consistency",
            triggered=freq < _MIN_FREQUENCY,
            value=freq,
            threshold=_MIN_FREQUENCY,
        )
