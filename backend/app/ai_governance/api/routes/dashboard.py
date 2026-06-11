from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.ai_governance.api.deps import get_dashboard_aggregator
from app.ai_governance.dashboards.aggregations import GovernanceDashboardAggregator
from app.ai_governance.schemas.dashboard import DashboardResponse

router = APIRouter()


def _resolve_period(
    period: str | None,
    since: datetime | None,
    until: datetime | None,
) -> tuple[datetime, datetime]:
    """
    Resolves the query time window.
    `period` shortcuts: today | 7d | 30d
    Falls back to since/until if provided, else defaults to last 7 days.
    """
    now = datetime.now(tz=timezone.utc)
    if period == "today":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        return start, now
    if period == "7d":
        return now - timedelta(days=7), now
    if period == "30d":
        return now - timedelta(days=30), now
    # Custom range
    start = since or (now - timedelta(days=7))
    end = until or now
    return start, end


@router.get(
    "/",
    response_model=DashboardResponse,
    summary="AI Governance Dashboard — KPIs, trends and distributions",
    description=(
        "Aggregated governance metrics for the specified time window. "
        "Use `period` for shortcuts (today/7d/30d) or `since`/`until` for a custom range."
    ),
)
async def get_dashboard(
    period: Annotated[
        str | None,
        Query(description="Shortcut: today | 7d | 30d"),
    ] = "7d",
    since: datetime | None = None,
    until: datetime | None = None,
    aggregator: GovernanceDashboardAggregator = Depends(get_dashboard_aggregator),
) -> DashboardResponse:
    period_start, period_end = _resolve_period(period, since, until)

    # Determine chart bucket granularity from window size
    delta_days = (period_end - period_start).days
    bucket = "hour" if delta_days <= 1 else "day"

    kpis = await aggregator.get_kpis(period_start, period_end)
    confidence_trend = await aggregator.get_confidence_trend(
        period_start, period_end, bucket=bucket
    )
    risk_dist = await aggregator.get_risk_distribution(period_start, period_end)
    review_outcomes = await aggregator.get_review_outcomes(period_start, period_end)

    from app.ai_governance.schemas.dashboard import (
        ConfidenceTrendPoint,
        DashboardKPIs,
        ReviewOutcomes,
        RiskDistribution,
    )

    return DashboardResponse(
        kpis=DashboardKPIs(**kpis),
        confidence_trend=[ConfidenceTrendPoint(**p) for p in confidence_trend],
        risk_distribution=RiskDistribution(
            low=risk_dist.get("low", 0),
            medium=risk_dist.get("medium", 0),
            high=risk_dist.get("high", 0),
        ),
        review_outcomes=ReviewOutcomes(**review_outcomes),
        period_start=period_start,
        period_end=period_end,
    )
