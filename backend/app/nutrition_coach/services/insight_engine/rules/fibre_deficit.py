from app.nutrition_coach.services.insight_engine.base_rule import BaseInsightRule, InsightResult

_DAILY_FIBRE_RECOMMENDATION_G = 25.0  # WHO / dietary guidelines


class FibreDeficitRule(BaseInsightRule):
    def evaluate(self, snapshot: dict) -> InsightResult:
        avg = snapshot.get("avg_fibre_g_7d", 0.0) or 0.0
        target = _DAILY_FIBRE_RECOMMENDATION_G
        adherence = avg / target
        return InsightResult(
            rule_name="fibre_deficit",
            triggered=avg < target,
            value=avg,
            threshold=target,
            adherence=adherence,
        )
