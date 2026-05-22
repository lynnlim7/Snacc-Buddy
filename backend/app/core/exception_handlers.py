from fastapi import FastAPI, Request
from fastapi.exception_handlers import request_validation_exception_handler
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.core.exceptions import (
    AIDuplicateRequest,
    AIParseError,
    AIQuotaExceeded,
    AIRateLimited,
    AIServiceError,
    AITimeoutError,
)


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(request: Request, exc: RequestValidationError):
        return await request_validation_exception_handler(request, exc)

    @app.exception_handler(AIQuotaExceeded)
    async def ai_quota_handler(_request: Request, _exc: AIQuotaExceeded):
        return JSONResponse(
            status_code=503,
            content={"detail": "AI analysis unavailable: daily quota exceeded. Try again tomorrow."},
        )

    @app.exception_handler(AIRateLimited)
    async def ai_rate_limited_handler(_request: Request, exc: AIRateLimited):
        return JSONResponse(
            status_code=429,
            headers={"Retry-After": str(int(exc.retry_after))},
            content={"detail": f"Too many requests. Retry after {int(exc.retry_after)} seconds."},
        )

    @app.exception_handler(AITimeoutError)
    async def ai_timeout_handler(_request: Request, _exc: AITimeoutError):
        return JSONResponse(
            status_code=504,
            content={"detail": "AI analysis timed out. Please try again."},
        )

    @app.exception_handler(AIDuplicateRequest)
    async def ai_duplicate_handler(_request: Request, _exc: AIDuplicateRequest):
        return JSONResponse(
            status_code=409,
            content={"detail": "This image is already being processed. Please wait and try again."},
        )

    @app.exception_handler(AIServiceError)
    async def ai_service_error_handler(_request: Request, _exc: AIServiceError):
        return JSONResponse(
            status_code=502,
            content={"detail": "AI analysis failed. Please try again."},
        )

    @app.exception_handler(AIParseError)
    async def ai_parse_error_handler(_request: Request, _exc: AIParseError):
        return JSONResponse(
            status_code=422,
            content={"detail": "AI returned an unexpected response format. Please try again."},
        )
