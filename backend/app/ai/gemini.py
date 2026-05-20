import io
import json

import google.generativeai as genai
from PIL import Image

from app.core.config import settings
from app.schemas.food import GeminiAnalysis

_ANALYSIS_PROMPT = """Analyze this food image and return nutritional information as JSON.

Return ONLY valid JSON with this exact structure — no markdown, no extra text:
{
  "food_name": "descriptive name of the food or dish",
  "ingredients": [{"name": "ingredient name", "amount": "estimated amount"}],
  "serving_size": "estimated serving size (e.g. '1 cup', '200g', '1 plate')",
  "origin": "cuisine/regional origin if identifiable (e.g. 'Thai', 'Italian') or null",
  "calories": <integer calorie estimate>,
  "macros": {
    "protein_g": <float>,
    "carbs_g": <float>,
    "fat_g": <float>
  },
  "confidence": <float between 0 and 1>,
  "notes": "any relevant notes about the estimate, or null"
}

Base your estimates on visible ingredients, portion size, and typical preparation methods for this dish.
If multiple foods are visible, analyse the whole meal."""


class GeminiService:
    def __init__(self) -> None:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel("gemini-1.5-flash")

    async def analyze_food_image(self, image_bytes: bytes) -> GeminiAnalysis:
        image = Image.open(io.BytesIO(image_bytes))
        response = await self.model.generate_content_async(
            [_ANALYSIS_PROMPT, image],
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                temperature=0.2,
            ),
        )
        data = json.loads(response.text)
        return GeminiAnalysis(**data)


gemini_service = GeminiService()
