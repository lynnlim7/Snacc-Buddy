import uuid
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.ai_governance.enums.review_enums import ReviewDecision


class HumanReviewCreate(BaseModel):
    inference_id: uuid.UUID
    original_food_name: str | None = None
    corrected_food_name: str | None = None
    original_calories: int | None = None
    corrected_calories: int | None = None
    review_notes: str | None = None
    decision: str = Field(
        ...,
        description="One of: APPROVED, REVIEW_REQUIRED, REJECTED",
    )

    @field_validator("decision")
    @classmethod
    def validate_decision(cls, v: str) -> str:
        try:
            ReviewDecision.from_str(v)
        except KeyError:
            raise ValueError(
                f"'{v}' is not a valid decision. Use: APPROVED, REVIEW_REQUIRED, REJECTED"
            )
        return v.upper()


class HumanReviewResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    inference_id: uuid.UUID
    reviewer_id: str | None
    original_food_name: str | None
    corrected_food_name: str | None
    original_calories: int | None
    corrected_calories: int | None
    review_notes: str | None
    valid_flag: float
    decision: str | None = None  # derived display field
    created_at: datetime

    @classmethod
    def from_orm_with_decision(cls, obj) -> "HumanReviewResponse":
        instance = cls.model_validate(obj)
        instance.decision = ReviewDecision.from_float(obj.valid_flag).name
        return instance


class HumanReviewListResponse(BaseModel):
    items: list[HumanReviewResponse]
    total: int
    limit: int
    offset: int
