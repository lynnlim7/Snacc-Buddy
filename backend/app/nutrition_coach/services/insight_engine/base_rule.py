from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class InsightResult:
    """Output of a single deterministic nutrition insight rule.

    rule_name:   Stable identifier (used in persisted insight row).
    triggered:   True when the rule fired — the insight applies to this user.
    value:       The scalar that drove the decision (e.g. avg_protein_g).
    threshold:   The target / ceiling compared against value.
    adherence:   Optional 0.0–1.0+ adherence ratio (actual / target).
    """

    rule_name: str
    triggered: bool
    value: float
    threshold: float
    adherence: float | None = None


class BaseInsightRule(ABC):
    """Strategy interface for individual nutrition insight rules.

    Design contract mirrors BaseRiskRule:
    - evaluate() is pure — no side effects, no I/O.
    - Adding a rule = create a subclass, register in engine.py.
    - No changes to existing rules required (Open/Closed).

    snapshot dict keys used across rules (all from UserNutritionSummary):
        avg_protein_g_7d      float
        avg_fibre_g_7d        float
        avg_sodium_g_7d       float
        avg_calories_7d       float
        logging_frequency_7d  float   (0.0–1.0)
        protein_target_g      float
        calorie_target        float
    """

    @property
    def name(self) -> str:
        return self.__class__.__name__

    @abstractmethod
    def evaluate(self, snapshot: dict) -> InsightResult:
        ...
