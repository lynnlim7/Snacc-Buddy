from datetime import datetime

from pydantic import BaseModel


class DashboardKPIs(BaseModel):
    total_inferences: int
    avg_confidence: float
    high_risk_inferences: int
    total_reviews: int
    approval_rate: float
    review_rate: float
    rejection_rate: float
    active_models: int
    active_prompts: int


class ConfidenceTrendPoint(BaseModel):
    period: str
    avg_confidence: float
    inference_count: int


class RiskDistribution(BaseModel):
    low: int = 0
    medium: int = 0
    high: int = 0


class ReviewOutcomes(BaseModel):
    approved: int = 0
    review_required: int = 0
    rejected: int = 0
    total: int = 0


class DashboardResponse(BaseModel):
    kpis: DashboardKPIs
    confidence_trend: list[ConfidenceTrendPoint]
    risk_distribution: RiskDistribution
    review_outcomes: ReviewOutcomes
    period_start: datetime
    period_end: datetime
