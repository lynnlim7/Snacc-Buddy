from app.nutrition_coach.services.insight_engine.base_rule import BaseInsightRule, InsightResult

_SURPLUS_FACTOR = 1.10  # flagged when average exceeds 110% of target


class CalorieSurplusRule(BaseInsightRule):
    def evaluate(self, snapshot: dict) -> InsightResult:
        avg = snapshot.get("avg_calories_7d", 0.0) or 0.0
        target = snapshot.get("calorie_target", 2000.0) or 2000.0
        ceiling = target * _SURPLUS_FACTOR
        adherence = avg / target if target else 1.0
        return InsightResult(
            rule_name="calorie_surplus",
            triggered=avg > ceiling,
            value=avg,
            threshold=ceiling,
            adherence=adherence,
        )
