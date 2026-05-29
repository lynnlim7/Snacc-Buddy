from fastapi import APIRouter
from app.api.routes import analyze, analytics, food

api_router = APIRouter()

api_router.include_router(analyze.router, tags=["food"])
api_router.include_router(food.router, tags=["food"])
api_router.include_router(analytics.router, tags=["analytics"])
