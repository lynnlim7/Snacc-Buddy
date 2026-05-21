import io
import json

import google.generativeai as genai
from PIL import Image

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
  "food_name": [
  {
  "name": "food item name",
    "estimated_quantity": {
        "value": <float>,
        "unit": "g | bowl | cup | plate | piece"
    },

    "preparation_method": "fried | steamed | grilled | roasted | baked | raw | unknown",

    "ingredients": [
        {
        "name": "ingredient or component name",
        "confidence": 0.0
        }
    ],

    "visible_sauces_or_oils": true, 
    
    "confidence": 0.0, 
    
    "possible_alternatives": ["alternative identification if uncertain"]
    }
    ],
    "estimated_total_calories": 0,
    "macros": {
    "protein_g": <float>,
    "carbs_g": <float>,
    "fat_g": <float>,
    "fiber_g": <float>,
    "sugar_g": <float>,
    "sodium_g": <float>,
    },

    "cuisine_type": "if identifiable otherwise null",

    "restaurant_or_brand": "if recognizable otherwise null",

    "overall_confidence": 0.0,

    "ambiguity_flags":[
    "hidden_ingredients",
    "unclear_portion_size",
    "mixed_food_overlap",
    "garnish_content_uncertain"
    ],

  "notes": "brief explanation of assumptions or uncertainties"
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
