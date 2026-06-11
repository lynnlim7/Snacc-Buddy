from app.ai_governance.services.risk_engine.base_rule import BaseRiskRule, RuleResult

# Thresholds calibrated against food-nutrition AI benchmarks.
# Each band represents a meaningfully different user-trust level.
_VERY_LOW = 0.4   # severely unreliable → +40 pts
_LOW = 0.6        # unreliable          → +25 pts
_MODERATE = 0.75  # uncertain           → +10 pts


class ConfidenceRule(BaseRiskRule):
    """
    Penalises low overall confidence scores from the AI model.

    Confidence is the primary proxy for output reliability.
    Three graduated bands allow proportional risk scoring rather
    than a binary high/low split.
    """

    def evaluate(self, context: dict) -> RuleResult:
        confidence = float(context.get("confidence_score") or 1.0)

        if confidence < _VERY_LOW:
            return RuleResult(
                rule_name="confidence_rule",
                score_contribution=40,
                triggered=True,
                reason=(
                    f"Very low confidence: {confidence:.2f} "
                    f"(threshold: {_VERY_LOW})"
                ),
            )
        if confidence < _LOW:
            return RuleResult(
                rule_name="confidence_rule",
                score_contribution=25,
                triggered=True,
                reason=(
                    f"Low confidence: {confidence:.2f} "
                    f"(threshold: {_LOW})"
                ),
            )
        if confidence < _MODERATE:
            return RuleResult(
                rule_name="confidence_rule",
                score_contribution=10,
                triggered=True,
                reason=(
                    f"Moderate confidence: {confidence:.2f} "
                    f"(threshold: {_MODERATE})"
                ),
            )
        return RuleResult(
            rule_name="confidence_rule",
            score_contribution=0,
            triggered=False,
            reason=f"Confidence acceptable: {confidence:.2f}",
        )
