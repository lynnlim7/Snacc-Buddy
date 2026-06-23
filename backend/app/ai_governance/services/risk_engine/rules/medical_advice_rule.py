import re

from app.ai_governance.services.risk_engine.base_rule import BaseRiskRule, RuleResult

# Terms that indicate the reply may be crossing into clinical advice territory.
# The list is intentionally broad to prefer false positives (escalate to review)
# over false negatives (silently pass medical advice).
_MEDICAL_TERMS = re.compile(
    r"\b(prescri|diagnos|medic(?:ate|ation)|drug|dosage|treatment plan|"
    r"cure|therapy|symptom|insulin|metformin|statin|antidepressant|"
    r"blood pressure medication)\b",
    re.IGNORECASE,
)

_SCORE = 35  # Lands in MEDIUM/HIGH band when combined with other signals


class MedicalAdviceRule(BaseRiskRule):
    """Flags coaching replies that may stray into clinical advice.

    Applied to the chat governance context where `reply` is present.
    Leaves food-analysis contexts (no `reply` key) unaffected.
    """

    def evaluate(self, context: dict) -> RuleResult:
        reply: str = context.get("reply", "") or ""
        triggered = bool(_MEDICAL_TERMS.search(reply))
        return RuleResult(
            rule_name="medical_advice",
            score_contribution=_SCORE if triggered else 0,
            triggered=triggered,
            reason=(
                "Reply contains clinical/medication language — escalate for human review."
                if triggered
                else "No clinical language detected."
            ),
        )
