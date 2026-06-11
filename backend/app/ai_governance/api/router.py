from fastapi import APIRouter

from app.ai_governance.api.routes import (
    dashboard,
    inferences,
    models,
    prompts,
    reviews,
    risk,
)

governance_router = APIRouter(prefix="/api/v1/governance", tags=["governance"])

governance_router.include_router(models.router, prefix="/models", tags=["governance:models"])
governance_router.include_router(prompts.router, prefix="/prompts", tags=["governance:prompts"])
governance_router.include_router(
    inferences.router, prefix="/inferences", tags=["governance:inferences"]
)
governance_router.include_router(risk.router, prefix="/risk", tags=["governance:risk"])
governance_router.include_router(reviews.router, prefix="/reviews", tags=["governance:reviews"])
governance_router.include_router(
    dashboard.router, prefix="/dashboard", tags=["governance:dashboard"]
)
