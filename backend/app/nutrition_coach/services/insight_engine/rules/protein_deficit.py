from app.nutrition_coach.services.insight_engine.base_rule import BaseInsightRule, InsightResult

_DEFICIT_THRESHOLD = 0.80  # flagged when average is <80% of target


class ProteinDeficitRule(BaseInsightRule):
    def evaluate(self, snapshot: dict) -> InsightResult:
        avg = snapshot.get("avg_protein_g_7d", 0.0) or 0.0
        target = snapshot.get("protein_target_g", 150.0) or 150.0
        adherence = avg / target if target else 1.0
        return InsightResult(
            rule_name="protein_deficit",
            triggered=adherence < _DEFICIT_THRESHOLD,
            value=avg,
            threshold=target,
            adherence=adherence,
        )
