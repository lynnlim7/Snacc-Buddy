from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi_limiter import FastAPILimiter

from app.api.routes import analytics, food, image
from app.core.auth import auth_backend, fastapi_users
from app.core.config import settings
from app.core.exception_handlers import register_exception_handlers
from app.core.limiter import rate_limit_callback, user_identifier
from app.core.redis import close_redis, get_redis
from app.schemas.user import UserCreate, UserRead, UserUpdate


@asynccontextmanager
async def _lifespan(_app: FastAPI):
    await FastAPILimiter.init(
        get_redis(),
        identifier=user_identifier,
        http_callback=rate_limit_callback,
    )
    yield
    await close_redis()


def create_app() -> FastAPI:
    app = FastAPI(
        title="Snacc Buddy API",
        description="Food calorie tracking via Gemini AI",
        version="0.1.0",
        lifespan=_lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(fastapi_users.get_auth_router(auth_backend), prefix="/auth/jwt", tags=["auth"])
    app.include_router(fastapi_users.get_register_router(UserRead, UserCreate), prefix="/auth", tags=["auth"])
    app.include_router(fastapi_users.get_reset_password_router(), prefix="/auth", tags=["auth"])
    app.include_router(fastapi_users.get_users_router(UserRead, UserUpdate), prefix="/users", tags=["users"])
    app.include_router(food.router, prefix="/api/v1/food", tags=["food"])
    app.include_router(image.router, prefix="/api/v1/food", tags=["food"])
    app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["analytics"])

    register_exception_handlers(app)

    @app.get("/health")
    async def health_check():
        return {"status": "ok"}

    return app
