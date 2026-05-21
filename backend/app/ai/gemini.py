import json

from google import genai
from google.genai import types

from app.core.config import settings
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


class GeminiService:
    def __init__(self) -> None:
        self._client = genai.Client(api_key=settings.GEMINI_API_KEY)

    async def analyze_food_image(
        self, image_bytes: bytes, mime_type: str = "image/jpeg"
    ) -> GeminiAnalysis:
        response = await self._client.aio.models.generate_content(
            model="gemini-2.0-flash",
            contents=[
                _ANALYSIS_PROMPT,
                types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2,
            ),
        )
        data = json.loads(response.text)
        return GeminiAnalysis.model_validate(data)


gemini_service = GeminiService()
