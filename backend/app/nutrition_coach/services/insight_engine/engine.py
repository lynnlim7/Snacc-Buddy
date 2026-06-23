import logging
from dataclasses import dataclass, field

from app.nutrition_coach.models.nutrition_insight import NutritionInsight
from app.nutrition_coach.models.user_nutrition_summary import UserNutritionSummary
from app.nutrition_coach.services.insight_engine.base_rule import BaseInsightRule, InsightResult
from app.nutrition_coach.services.insight_engine.rules.calorie_surplus import CalorieSurplusRule
from app.nutrition_coach.services.insight_engine.rules.excess_sodium import ExcessSodiumRule
from app.nutrition_coach.services.insight_engine.rules.fibre_deficit import FibreDeficitRule
from app.nutrition_coach.services.insight_engine.rules.meal_consistency import MealConsistencyRule
from app.nutrition_coach.services.insight_engine.rules.protein_deficit import ProteinDeficitRule

logger = logging.getLogger(__name__)


@dataclass
class InsightEvaluation:
    triggered_rules: list[InsightResult]
    all_rules: list[InsightResult]
    protein_deficit: bool = field(init=False)
    fibre_deficit: bool = field(init=False)
    excess_sodium: bool = field(init=False)
    calorie_surplus: bool = field(init=False)
    low_meal_consistency: bool = field(init=False)
    protein_adherence: float | None = field(init=False)
    calorie_adherence: float | None = field(init=False)
    fibre_adherence: float | None = field(init=False)

    def __post_init__(self) -> None:
        by_name = {r.rule_name: r for r in self.all_rules}
        self.protein_deficit = by_name.get("protein_deficit", InsightResult("", False, 0, 0)).triggered
        self.fibre_deficit = by_name.get("fibre_deficit", InsightResult("", False, 0, 0)).triggered
        self.excess_sodium = by_name.get("excess_sodium", InsightResult("", False, 0, 0)).triggered
        self.calorie_surplus = by_name.get("calorie_surplus", InsightResult("", False, 0, 0)).triggered
        self.low_meal_consistency = by_name.get("low_meal_consistency", InsightResult("", False, 0, 0)).triggered
        self.protein_adherence = by_name.get("protein_deficit", InsightResult("", False, 0, 0, None)).adherence
        self.calorie_adherence = by_name.get("calorie_surplus", InsightResult("", False, 0, 0, None)).adherence
        self.fibre_adherence = by_name.get("fibre_deficit", InsightResult("", False, 0, 0, None)).adherence


class NutritionInsightEngine:
    """Deterministic rule engine — architectural twin of RiskAssessmentEngine.

    Rules are evaluated independently on the memory snapshot. No AI call, no
    audit row — output is reproducible given the same snapshot.

    Extending:
        1. Create a BaseInsightRule subclass in rules/
        2. Add it to DEFAULT_RULES
        3. No other changes required (Open/Closed Principle)
    """

    DEFAULT_RULES: list[BaseInsightRule] = [
        ProteinDeficitRule(),
        FibreDeficitRule(),
        ExcessSodiumRule(),
        CalorieSurplusRule(),
        MealConsistencyRule(),
    ]

    def __init__(self, rules: list[BaseInsightRule] | None = None) -> None:
        self._rules = rules if rules is not None else list(self.DEFAULT_RULES)

    def evaluate(self, snapshot: UserNutritionSummary) -> InsightEvaluation:
        context = {
            "avg_calories_7d": snapshot.avg_calories_7d,
            "avg_protein_g_7d": snapshot.avg_protein_g_7d,
            "avg_fibre_g_7d": snapshot.avg_fibre_g_7d,
            "avg_sodium_g_7d": snapshot.avg_sodium_g_7d,
            "logging_frequency_7d": snapshot.logging_frequency_7d,
            "calorie_target": snapshot.calorie_target,
            "protein_target_g": snapshot.protein_target_g,
        }

        all_results: list[InsightResult] = [rule.evaluate(context) for rule in self._rules]
        triggered = [r for r in all_results if r.triggered]

        logger.debug(
            "insight_engine.evaluate user=%s triggered=%d/%d",
            snapshot.user_id,
            len(triggered),
            len(all_results),
        )

        return InsightEvaluation(triggered_rules=triggered, all_rules=all_results)

    def to_db_model(
        self,
        evaluation: InsightEvaluation,
        user_id: str,
        summary_id,
    ) -> NutritionInsight:
        return NutritionInsight(
            user_id=user_id,
            summary_id=summary_id,
            protein_deficit=evaluation.protein_deficit,
            fibre_deficit=evaluation.fibre_deficit,
            excess_sodium=evaluation.excess_sodium,
            calorie_surplus=evaluation.calorie_surplus,
            weight_loss_stalled=False,  # requires weight history — deferred
            low_meal_consistency=evaluation.low_meal_consistency,
            protein_adherence_pct=evaluation.protein_adherence,
            calorie_adherence_pct=evaluation.calorie_adherence,
            fibre_adherence_pct=evaluation.fibre_adherence,
        )
