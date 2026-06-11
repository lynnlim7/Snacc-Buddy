import logging
from dataclasses import dataclass, field

from app.ai_governance.enums.model_enums import RiskTier
from app.ai_governance.services.risk_engine.base_rule import BaseRiskRule, RuleResult
from app.ai_governance.services.risk_engine.rules.confidence_rule import ConfidenceRule
from app.ai_governance.services.risk_engine.rules.mixed_food_rule import MixedFoodRule
from app.ai_governance.services.risk_engine.rules.restaurant_rule import RestaurantRule
from app.ai_governance.services.risk_engine.rules.calorie_plausibility_rule import (
    CaloriePlausibilityRule,
)
from app.ai_governance.services.risk_engine.rules.ingredient_uncertainty_rule import (
    IngredientUncertaintyRule,
)

logger = logging.getLogger(__name__)

_MAX_SCORE = 100


def _score_to_tier(score: int) -> RiskTier:
    """
    Maps raw additive score to a risk tier.

    Thresholds:
        ≥ 50 → HIGH   (requires human review before food log is saved)
        ≥ 25 → MEDIUM (flagged for review, but auto-saved)
        <  25 → LOW   (no intervention needed)
    """
    if score >= 50:
        return RiskTier.HIGH
    if score >= 25:
        return RiskTier.MEDIUM
    return RiskTier.LOW


@dataclass
class RiskEvaluation:
    risk_score: int
    risk_level: RiskTier
    triggered_rules: list[RuleResult]
    all_rules: list[RuleResult]
    reasons: list[dict] = field(default_factory=list)

    def __post_init__(self) -> None:
        # Pre-build the JSONB reasons list ready for DB persistence
        self.reasons = [
            {
                "rule": r.rule_name,
                "score_contribution": r.score_contribution,
                "triggered": r.triggered,
                "reason": r.reason,
            }
            for r in self.all_rules
        ]


class RiskAssessmentEngine:
    """
    Pluggable rule engine using the Strategy pattern.

    Rules are evaluated independently; their score_contributions are
    summed and capped at 100.

    Extending:
        1. Create a BaseRiskRule subclass in rules/
        2. Add it to DEFAULT_RULES (or inject via constructor for tests)
        3. No other changes required (Open/Closed Principle)

    Context dict keys (all optional — rules handle missing gracefully):
        confidence_score          float   0.0–1.0
        ambiguity_flags           list    ["hidden_ingredients", ...]
        ingredients               list    [{"name": "...", "confidence": N}]
        restaurant_or_brand       str|None
        estimated_total_calories  int
    """

    DEFAULT_RULES: list[BaseRiskRule] = [
        ConfidenceRule(),
        MixedFoodRule(),
        RestaurantRule(),
        CaloriePlausibilityRule(),
        IngredientUncertaintyRule(),
    ]

    def __init__(self, rules: list[BaseRiskRule] | None = None) -> None:
        self._rules = rules if rules is not None else list(self.DEFAULT_RULES)

    def evaluate(self, context: dict) -> RiskEvaluation:
        all_results: list[RuleResult] = [rule.evaluate(context) for rule in self._rules]
        triggered = [r for r in all_results if r.triggered]
        total_score = min(
            sum(r.score_contribution for r in all_results), _MAX_SCORE
        )
        risk_level = _score_to_tier(total_score)

        logger.debug(
            "risk_engine.evaluate score=%d level=%s triggered=%d/%d",
            total_score,
            risk_level.value,
            len(triggered),
            len(all_results),
        )

        return RiskEvaluation(
            risk_score=total_score,
            risk_level=risk_level,
            triggered_rules=triggered,
            all_rules=all_results,
        )
