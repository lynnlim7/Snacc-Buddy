"""
Unit tests for the RiskAssessmentEngine.

All tests are pure unit tests — no database, no I/O.
The engine and rules are entirely side-effect-free.
"""
import pytest

from app.ai_governance.enums.model_enums import RiskTier
from app.ai_governance.services.risk_engine.base_rule import BaseRiskRule, RuleResult
from app.ai_governance.services.risk_engine.engine import RiskAssessmentEngine
from app.ai_governance.services.risk_engine.rules.calorie_plausibility_rule import (
    CaloriePlausibilityRule,
)
from app.ai_governance.services.risk_engine.rules.confidence_rule import ConfidenceRule
from app.ai_governance.services.risk_engine.rules.ingredient_uncertainty_rule import (
    IngredientUncertaintyRule,
)
from app.ai_governance.services.risk_engine.rules.mixed_food_rule import MixedFoodRule
from app.ai_governance.services.risk_engine.rules.restaurant_rule import RestaurantRule


# ── ConfidenceRule ────────────────────────────────────────────────────────────

class TestConfidenceRule:
    def setup_method(self):
        self.rule = ConfidenceRule()

    def test_very_low_confidence_contributes_40(self):
        result = self.rule.evaluate({"confidence_score": 0.3})
        assert result.triggered is True
        assert result.score_contribution == 40

    def test_low_confidence_contributes_25(self):
        result = self.rule.evaluate({"confidence_score": 0.55})
        assert result.triggered is True
        assert result.score_contribution == 25

    def test_moderate_confidence_contributes_10(self):
        result = self.rule.evaluate({"confidence_score": 0.65})
        assert result.triggered is True
        assert result.score_contribution == 10

    def test_high_confidence_no_contribution(self):
        result = self.rule.evaluate({"confidence_score": 0.9})
        assert result.triggered is False
        assert result.score_contribution == 0

    def test_boundary_exactly_at_threshold_not_triggered(self):
        # Boundary: 0.75 is NOT below _MODERATE threshold
        result = self.rule.evaluate({"confidence_score": 0.75})
        assert result.triggered is False

    def test_missing_confidence_defaults_to_no_penalty(self):
        result = self.rule.evaluate({})
        assert result.triggered is False

    def test_reason_contains_score(self):
        result = self.rule.evaluate({"confidence_score": 0.3})
        assert "0.30" in result.reason


# ── MixedFoodRule ─────────────────────────────────────────────────────────────

class TestMixedFoodRule:
    def setup_method(self):
        self.rule = MixedFoodRule()

    def test_hidden_ingredients_flag_triggers(self):
        result = self.rule.evaluate({"ambiguity_flags": ["hidden_ingredients"]})
        assert result.triggered is True
        assert result.score_contribution == 20

    def test_unclear_portion_size_triggers(self):
        result = self.rule.evaluate({"ambiguity_flags": ["unclear_portion_size"]})
        assert result.triggered is True

    def test_high_ingredient_count_triggers(self):
        ingredients = [{"name": f"item_{i}"} for i in range(9)]
        result = self.rule.evaluate({"ingredients": ingredients, "ambiguity_flags": []})
        assert result.triggered is True

    def test_simple_dish_no_penalty(self):
        result = self.rule.evaluate({"ambiguity_flags": [], "ingredients": [{"name": "egg"}]})
        assert result.triggered is False
        assert result.score_contribution == 0


# ── RestaurantRule ────────────────────────────────────────────────────────────

class TestRestaurantRule:
    def setup_method(self):
        self.rule = RestaurantRule()

    def test_restaurant_detected_triggers(self):
        result = self.rule.evaluate({"restaurant_or_brand": "McDonald's"})
        assert result.triggered is True
        assert result.score_contribution == 15
        assert "McDonald's" in result.reason

    def test_no_restaurant_no_penalty(self):
        result = self.rule.evaluate({"restaurant_or_brand": None})
        assert result.triggered is False
        assert result.score_contribution == 0

    def test_missing_key_no_penalty(self):
        result = self.rule.evaluate({})
        assert result.triggered is False


# ── CaloriePlausibilityRule ───────────────────────────────────────────────────

class TestCaloriePlausibilityRule:
    def setup_method(self):
        self.rule = CaloriePlausibilityRule()

    def test_too_low_triggers(self):
        result = self.rule.evaluate({"estimated_total_calories": 10})
        assert result.triggered is True
        assert result.score_contribution == 35

    def test_too_high_triggers(self):
        result = self.rule.evaluate({"estimated_total_calories": 9999})
        assert result.triggered is True

    def test_normal_calories_no_penalty(self):
        result = self.rule.evaluate({"estimated_total_calories": 600})
        assert result.triggered is False
        assert result.score_contribution == 0

    def test_boundary_minimum_not_triggered(self):
        result = self.rule.evaluate({"estimated_total_calories": 50})
        assert result.triggered is False

    def test_boundary_maximum_not_triggered(self):
        result = self.rule.evaluate({"estimated_total_calories": 5000})
        assert result.triggered is False

    def test_invalid_calories_defaults_to_triggered(self):
        result = self.rule.evaluate({"estimated_total_calories": None})
        assert result.triggered is True  # None → 0 → below minimum


# ── IngredientUncertaintyRule ─────────────────────────────────────────────────

class TestIngredientUncertaintyRule:
    def setup_method(self):
        self.rule = IngredientUncertaintyRule()

    def test_majority_low_confidence_triggers(self):
        ingredients = [
            {"name": "a", "confidence": 0.3},
            {"name": "b", "confidence": 0.4},
            {"name": "c", "confidence": 0.9},
        ]
        result = self.rule.evaluate({"ingredients": ingredients})
        assert result.triggered is True  # 2/3 > 50%

    def test_minority_low_confidence_no_trigger(self):
        ingredients = [
            {"name": "a", "confidence": 0.3},
            {"name": "b", "confidence": 0.9},
            {"name": "c", "confidence": 0.8},
        ]
        result = self.rule.evaluate({"ingredients": ingredients})
        assert result.triggered is False  # 1/3 ≤ 50%

    def test_empty_ingredients_no_penalty(self):
        result = self.rule.evaluate({"ingredients": []})
        assert result.triggered is False

    def test_missing_confidence_key_treated_as_high(self):
        # Missing confidence key → defaults to 1.0 (confident)
        ingredients = [{"name": "chicken"}, {"name": "rice"}]
        result = self.rule.evaluate({"ingredients": ingredients})
        assert result.triggered is False


# ── RiskAssessmentEngine ──────────────────────────────────────────────────────

class TestRiskAssessmentEngine:
    def test_score_caps_at_100(self):
        engine = RiskAssessmentEngine()
        ctx = {
            "confidence_score": 0.1,          # +40
            "ambiguity_flags": ["hidden_ingredients"],  # +20
            "restaurant_or_brand": "KFC",       # +15
            "estimated_total_calories": 99999,  # +35
            "ingredients": [{"name": f"i_{n}", "confidence": 0.1} for n in range(10)],
        }
        result = engine.evaluate(ctx)
        assert result.risk_score == 100

    def test_clean_context_is_low_risk(self):
        engine = RiskAssessmentEngine()
        ctx = {
            "confidence_score": 0.95,
            "ambiguity_flags": [],
            "restaurant_or_brand": None,
            "estimated_total_calories": 550,
            "ingredients": [{"name": "chicken", "confidence": 0.9}],
        }
        result = engine.evaluate(ctx)
        assert result.risk_level == RiskTier.LOW

    def test_custom_rule_injection(self):
        """Engine must accept injected rules for testing (Open/Closed + testability)."""

        class AlwaysHighRule(BaseRiskRule):
            def evaluate(self, context: dict) -> RuleResult:
                return RuleResult("always_high", 100, True, "forced high")

        engine = RiskAssessmentEngine(rules=[AlwaysHighRule()])
        result = engine.evaluate({})
        assert result.risk_level == RiskTier.HIGH
        assert result.risk_score == 100

    def test_empty_rules_produces_low_risk(self):
        engine = RiskAssessmentEngine(rules=[])
        result = engine.evaluate({"confidence_score": 0.1})
        assert result.risk_score == 0
        assert result.risk_level == RiskTier.LOW

    def test_reasons_list_populated(self):
        engine = RiskAssessmentEngine()
        result = engine.evaluate({"confidence_score": 0.3})
        assert len(result.reasons) == len(engine._rules)
        for reason in result.reasons:
            assert "rule" in reason
            assert "score_contribution" in reason
            assert "reason" in reason
            assert "triggered" in reason

    def test_tier_thresholds(self):
        from app.ai_governance.services.risk_engine.engine import _score_to_tier
        assert _score_to_tier(0) == RiskTier.LOW
        assert _score_to_tier(24) == RiskTier.LOW
        assert _score_to_tier(25) == RiskTier.MEDIUM
        assert _score_to_tier(49) == RiskTier.MEDIUM
        assert _score_to_tier(50) == RiskTier.HIGH
        assert _score_to_tier(100) == RiskTier.HIGH
