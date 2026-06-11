from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class RuleResult:
    """
    Output of a single risk rule evaluation.

    rule_name:          Stable identifier used in audit reasons JSONB.
    score_contribution: Points added to the total risk score (0–100 range, additive).
    triggered:          True when the rule matched a risk signal.
    reason:             Human-readable explanation stored in the audit record.
    """

    rule_name: str
    score_contribution: int
    triggered: bool
    reason: str


class BaseRiskRule(ABC):
    """
    Strategy interface for individual risk rules.

    Design contract:
    - evaluate() must be pure — no side effects, no I/O.
    - Adding a new rule = create a subclass, register in engine.py.
    - No changes to existing rules or the engine are required (Open/Closed).

    context dict keys used across rules:
        confidence_score          float   0.0–1.0
        ambiguity_flags           list    ["hidden_ingredients", ...]
        ingredients               list    [{"name": "...", "confidence": ...}]
        restaurant_or_brand       str|None
        estimated_total_calories  int
    """

    @property
    def name(self) -> str:
        return self.__class__.__name__

    @abstractmethod
    def evaluate(self, context: dict) -> RuleResult:
        ...
