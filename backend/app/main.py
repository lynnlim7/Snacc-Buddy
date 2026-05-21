import logging
from fastapi import FastAPI, Request
from fastapi.exception_handlers import request_validation_exception_handler
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

logger = logging.getLogger("uvicorn.error")

from app.api.routes import analytics, food, image
from app.core.auth import auth_backend, fastapi_users
from app.core.config import settings
from app.schemas.user import UserCreate, UserRead, UserUpdate

app = FastAPI(
    title="Snacc Buddy API",
    description="Food calorie tracking via Gemini AI",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    fastapi_users.get_auth_router(auth_backend),
    prefix="/auth/jwt",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_reset_password_router(),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_users_router(UserRead, UserUpdate),
    prefix="/users",
    tags=["users"],
)

@app.exception_handler(RequestValidationError)
async def validation_error_handler(request, exc: RequestValidationError):
    return await request_validation_exception_handler(request, exec)

app.include_router(food.router, prefix="/api/v1/food", tags=["food"])
app.include_router(image.router, prefix="/api/v1/food", tags=["food"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["analytics"])


@app.get("/health")
async def health_check():
    return {"status": "ok"}