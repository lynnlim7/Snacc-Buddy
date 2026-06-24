import hashlib
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi_limiter import FastAPILimiter
from sqlalchemy import select

from app.ai_governance.api.router import governance_router
from app.ai_governance.enums.model_enums import ModelProvider, ModelStatus, RiskTier
from app.ai_governance.enums.prompt_enums import PromptStatus
from app.ai_governance.models.ai_model import AIModel
from app.ai_governance.models.prompt_version import PromptVersion
from app.api.routes import analytics, analyze, chat, food, nutrition_coach
from app.core.auth import auth_backend, fastapi_users
from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.core.exception_handlers import register_exception_handlers
from app.core.limiter import rate_limit_callback, user_identifier
from app.core.redis import close_redis, get_redis
from app.prompt.prompt import PROMPTS
from app.schemas.user import UserCreate, UserRead, UserUpdate

logger = logging.getLogger(__name__)


async def _seed_governance() -> None:
    """Seed a default model + prompt if the governance tables are empty.

    Ensures fresh deployments can call /analyze without a 503 from missing governance config.
    """
    async with AsyncSessionLocal() as db:
        existing = (await db.execute(select(AIModel).limit(1))).scalar_one_or_none()
        if existing:
            return

        model = AIModel(
            name=f"Gemini {settings.GEMINI_MODEL}",
            provider=ModelProvider.GOOGLE,
            model_identifier=settings.GEMINI_MODEL,
            version="1",
            status=ModelStatus.ACTIVE,
            is_default=True,
            capabilities=["vision", "nutrition_analysis"],
            risk_tier=RiskTier.MEDIUM,
        )
        db.add(model)
        await db.flush()

        analysis_prompt = PROMPTS["system_prompt"]
        content_hash = hashlib.sha256(analysis_prompt.encode()).hexdigest()
        prompt = PromptVersion(
            model_id=model.id,
            version=1,
            name="Food analysis v1",
            prompt_template=analysis_prompt,
            content_hash=content_hash,
            status=PromptStatus.ACTIVE,
            is_active=True,
        )
        db.add(prompt)
        await db.commit()
        logger.info("governance_seed: created default model=%s prompt=v1", settings.GEMINI_MODEL)


@asynccontextmanager
async def _lifespan(_app: FastAPI):
    await FastAPILimiter.init(
        get_redis(),
        identifier=user_identifier,
        http_callback=rate_limit_callback,
    )
    await _seed_governance()
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
    app.include_router(fastapi_users.get_verify_router(UserRead), prefix="/auth", tags=["auth"])
    app.include_router(fastapi_users.get_register_router(UserRead, UserCreate), prefix="/auth", tags=["auth"])
    app.include_router(fastapi_users.get_reset_password_router(), prefix="/auth", tags=["auth"])
    app.include_router(fastapi_users.get_users_router(UserRead, UserUpdate), prefix="/users", tags=["users"])
    app.include_router(analyze.router, prefix="/api/v1/food", tags=["food"])
    app.include_router(food.router, prefix="/api/v1/food", tags=["food"])
    app.include_router(chat.router, prefix="/api/v1/food", tags=["food"])
    app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["analytics"])
    app.include_router(nutrition_coach.router, prefix="/api/v1/nutrition-coach", tags=["nutrition-coach"])
    app.include_router(governance_router)

    register_exception_handlers(app)

    @app.get("/health")
    async def health_check():
        return {"status": "ok"}

    return app
