import hashlib

from fastapi import Request
from fastapi.responses import JSONResponse, Response


async def user_identifier(request: Request) -> str:
    """Per-user rate-limit key derived from the Bearer token, falling back to client IP."""
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return "user:" + hashlib.sha256(auth[7:].encode()).hexdigest()[:16]
    return "ip:" + (request.client.host or "unknown")


async def rate_limit_callback(request: Request, response: Response, pexpire: int) -> JSONResponse:
    """Response returned when a client exceeds the configured rate limit."""
    retry_after = pexpire // 1000
    return JSONResponse(
        status_code=429,
        content={"detail": f"Too many requests. Retry after {retry_after} seconds."},
        headers={"Retry-After": str(retry_after)},
    )
