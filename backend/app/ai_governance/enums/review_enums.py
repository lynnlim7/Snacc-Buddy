import enum


class ReviewDecision(enum.Enum):
    """
    Domain abstraction over the numeric valid_flag stored in the database.

    Storing floats (not strings) enables direct SQL aggregation:
        AVG(valid_flag)                   → weighted rejection signal
        SUM(valid_flag = 0.0) / COUNT(*)  → approval rate
        SUM(valid_flag = 1.0) / COUNT(*)  → rejection rate

    Values:
        0.0 → APPROVED
        0.5 → REVIEW_REQUIRED
        1.0 → REJECTED
    """

    APPROVED = 0.0
    REVIEW_REQUIRED = 0.5
    REJECTED = 1.0

    @classmethod
    def from_float(cls, value: float) -> "ReviewDecision":
        for member in cls:
            if member.value == value:
                return member
        raise ValueError(f"No ReviewDecision for value {value!r}")

    @classmethod
    def from_str(cls, value: str) -> "ReviewDecision":
        return cls[value.upper()]
