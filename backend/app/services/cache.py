from app.core.config import settings
from app.core.redis import get_redis
from app.schemas.food import GeminiAnalysis


async def get_cached_analysis(image_hash: str) -> GeminiAnalysis | None:
    """Return a cached GeminiAnalysis for this image hash, or None on a miss."""
    raw = await get_redis().get(f"gemini:cache:{image_hash}")
    if raw:
        return GeminiAnalysis.model_validate_json(raw)
    return None


async def set_cached_analysis(image_hash: str, analysis: GeminiAnalysis) -> None:
    """Cache a GeminiAnalysis keyed by image hash with a configurable TTL."""
    await get_redis().setex(
        f"gemini:cache:{image_hash}",
        settings.GEMINI_CACHE_TTL_SECONDS,
        analysis.model_dump_json(),
    )
