import asyncio
import json
from pydantic import ValidationError
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from google import genai
from google.genai import types
from google.genai.errors import ClientError

from app.core.config import settings
from app.core.exceptions import AIParseError, AIQuotaExceeded, AIRateLimited, AIServiceError, AITimeoutError
from app.schemas.food import GeminiAnalysis

_ANALYSIS_PROMPT = """
You are a food analysis assistant.

Analyze the uploaded food image carefully.

Your primary goal is to identify observable food items and estimate portion sizes as accurately and conservatively as possible.

Focus on:
- observable food items
- estimated quantities
- preparation methods
- visible sauces/oils
- uncertainty handling

DO NOT hallucinate ingredients or quantities that are not visible or strongly implied.

Return ONLY valid JSON.

DO NOT include markdown, explanations or additional text.

Use this exact JSON structure:

{
  "food_name": "name of the overall meal or dish",
  "serving_size": "estimated serving size as a string",
  "preparation_method": "fried | steamed | grilled | roasted | baked | raw | unknown",
  "ingredients": [
    {
      "name": "ingredient or component name",
      "confidence": 0.0
    }
  ],
  "visible_sauces_or_oils": true,
  "cuisine_type": "if identifiable otherwise null",
  "restaurant_or_brand": "if recognizable otherwise null",
  "estimated_total_calories": 0,
  "macros": {
    "protein_g": 0.0,
    "carbs_g": 0.0,
    "fat_g": 0.0,
    "fibre_g": 0.0,
    "sugar_g": 0.0,
    "sodium_g": 0.0
  },
  "overall_confidence": 0.0,
  "ambiguity_flags": [
    "hidden_ingredients",
    "unclear_portion_size"
  ],
  "notes": "brief explanation of assumptions or uncertainties"
}

Base your estimates on visible ingredients, portion size, and typical preparation methods for this dish.
If multiple foods are visible, analyse the whole meal as one entry."""


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


gemini_service = GeminiService()
