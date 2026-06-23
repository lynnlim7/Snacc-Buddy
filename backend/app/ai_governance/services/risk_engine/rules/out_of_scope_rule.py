from app.ai_governance.services.risk_engine.base_rule import BaseRiskRule, RuleResult

_SCORE = 20  # Non-critical — prompt-level guardrail is the primary defence


class OutOfScopeRule(BaseRiskRule):
    """Flags coaching inferences where the model marked the reply as out-of-scope.

    Applied to the chat governance context where `in_scope` is present.
    Leaves food-analysis contexts (no `in_scope` key) unaffected.
    """

    def evaluate(self, context: dict) -> RuleResult:
        in_scope: bool = context.get("in_scope", True)
        triggered = not in_scope
        return RuleResult(
            rule_name="out_of_scope",
            score_contribution=_SCORE if triggered else 0,
            triggered=triggered,
            reason=(
                "Model flagged reply as outside nutrition scope."
                if triggered
                else "Reply is within scope."
            ),
        )
