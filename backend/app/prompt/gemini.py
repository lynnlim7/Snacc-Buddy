import asyncio
import json

from google import genai
from google.genai import types
from google.genai.errors import ClientError
from pydantic import ValidationError
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from app.core.config import settings
from app.core.exceptions import (
    AIParseError,
    AIQuotaExceeded,
    AIRateLimited,
    AIServiceError,
    AITimeoutError,
)
from app.prompt.prompt import PROMPTS
from app.schemas.coach import CoachChatResponse
from app.schemas.food import GeminiAnalysis

_ANALYSIS_PROMPT = PROMPTS["system_prompt"]
_COACH_PROMPT = PROMPTS["coach_system_prompt"]


def _parse_retry_after(e: ClientError) -> float | None:
    """Extract retry delay seconds from a 429 ClientError response, or None."""
    try:
        for d in (e.details or {}).get("error", {}).get("details", []):
            if "RetryInfo" in d.get("@type", ""):
                delay_str = d.get("retryDelay", "")
                if delay_str:
                    return float(delay_str.rstrip("s"))
    except Exception:
        pass
    return None


def _is_daily_quota_exhausted(e: ClientError) -> bool:
    """True when a PerDay free-tier quota violation is present in the error."""
    try:
        for d in (e.details or {}).get("error", {}).get("details", []):
            for v in d.get("violations", []):
                if "PerDay" in v.get("quotaId", ""):
                    return True
    except Exception:
        pass
    return False


class GeminiService:
    def __init__(self) -> None:
        self._client = genai.Client(api_key=settings.GEMINI_API_KEY)

    # Retries only AIRateLimited (per-minute cap) — not AIQuotaExceeded (daily limit).
    @retry(
        retry=retry_if_exception_type(AIRateLimited),
        wait=wait_exponential(multiplier=1, min=4, max=30),
        stop=stop_after_attempt(3),
        reraise=True,
    )
    async def analyze_food_image(
        self, image_bytes: bytes, mime_type: str = "image/jpeg"
    ) -> GeminiAnalysis:
        try:
            response = await asyncio.wait_for(
                self._client.aio.models.generate_content(
                    model=settings.GEMINI_MODEL,
                    contents=[
                        _ANALYSIS_PROMPT,
                        types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                    ],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=settings.GEMINI_TEMPERATURE,
                    ),
                ),
                timeout=settings.GEMINI_TIMEOUT_SECONDS,
            )
            data = json.loads(response.text)
            return GeminiAnalysis.model_validate(data)
        except asyncio.TimeoutError as e:
            raise AITimeoutError() from e
        except ClientError as e:
            if e.code == 429:
                if _is_daily_quota_exhausted(e):
                    raise AIQuotaExceeded() from e
                raise AIRateLimited(_parse_retry_after(e) or 10.0) from e
            raise AIServiceError(str(e)) from e
        except (json.JSONDecodeError, ValidationError) as e:
            raise AIParseError(str(e)) from e


    async def refine_analysis(
        self,
        prior_analysis: GeminiAnalysis,
        messages: list[dict],
    ) -> GeminiAnalysis:
        system_preamble = (
            f"Prior food analysis: {prior_analysis.model_dump_json()}\n\n"
            "Revise your analysis based on the user's correction. "
            "Return ONLY valid JSON matching the original schema."
        )
        contents = [system_preamble] + [
            types.Content(role=m["role"], parts=[types.Part(text=m["content"])])
            for m in messages
        ]
        try:
            response = await asyncio.wait_for(
                self._client.aio.models.generate_content(
                    model=settings.GEMINI_MODEL,
                    contents=contents,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=settings.GEMINI_TEMPERATURE,
                    ),
                ),
                timeout=settings.GEMINI_TIMEOUT_SECONDS,
            )
            return GeminiAnalysis.model_validate(json.loads(response.text))
        except asyncio.TimeoutError as e:
            raise AITimeoutError() from e
        except ClientError as e:
            if e.code == 429:
                if _is_daily_quota_exhausted(e):
                    raise AIQuotaExceeded() from e
                raise AIRateLimited(_parse_retry_after(e) or 10.0) from e
            raise AIServiceError(str(e)) from e
        except (json.JSONDecodeError, ValidationError) as e:
            raise AIParseError(str(e)) from e


    async def coach_chat(
        self,
        user_context: dict,
        messages: list[dict],
    ) -> CoachChatResponse:
        """Answer a nutrition-coach question grounded in the user's own data.

        `user_context` is injected as ground truth; `messages` is the running
        conversation ({"role": "user"|"coach", "content": str}). Roles are mapped
        to Gemini's "user"/"model" convention. Scope + medical guardrails live in
        the coach system prompt, which forces a JSON CoachChatResponse.
        """
        context_block = (
            "USER CONTEXT (ground truth — base all advice on this):\n"
            + json.dumps(user_context, default=str, indent=2)
        )
        contents = [_COACH_PROMPT, context_block] + [
            types.Content(
                role="model" if m["role"] == "coach" else "user",
                parts=[types.Part(text=m["content"])],
            )
            for m in messages
        ]
        try:
            response = await asyncio.wait_for(
                self._client.aio.models.generate_content(
                    model=settings.GEMINI_MODEL,
                    contents=contents,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=settings.GEMINI_TEMPERATURE,
                    ),
                ),
                timeout=settings.GEMINI_TIMEOUT_SECONDS,
            )
            return CoachChatResponse.model_validate(json.loads(response.text))
        except asyncio.TimeoutError as e:
            raise AITimeoutError() from e
        except ClientError as e:
            if e.code == 429:
                if _is_daily_quota_exhausted(e):
                    raise AIQuotaExceeded() from e
                raise AIRateLimited(_parse_retry_after(e) or 10.0) from e
            raise AIServiceError(str(e)) from e
        except (json.JSONDecodeError, ValidationError) as e:
            raise AIParseError(str(e)) from e


    async def embed_text(self, text: str) -> list[float]:
        """Embed a text string using the configured Gemini embedding model.

        Returns a flat list of floats (length = EMBEDDING_DIM).
        """
        import asyncio as _asyncio

        response = await _asyncio.wait_for(
            self._client.aio.models.embed_content(
                model=settings.EMBEDDING_MODEL,
                contents=text,
                config=types.EmbedContentConfig(output_dimensionality=settings.EMBEDDING_DIM),
            ),
            timeout=settings.GEMINI_TIMEOUT_SECONDS,
        )
        return list(response.embeddings[0].values)


gemini_service = GeminiService()
