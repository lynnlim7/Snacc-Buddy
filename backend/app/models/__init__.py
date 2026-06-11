"""
Models pacakge
Import all models here to ensure they are registered with SQLAlchemy
"""

from app.models.user import User
from app.models.food_log import FoodLog
from app.models.llm_response import LLMResponse

# Governance models — must be imported so SQLAlchemy registers them in Base.metadata
from app.ai_governance.models.ai_model import AIModel
from app.ai_governance.models.prompt_version import PromptVersion
from app.ai_governance.models.inference_log import AIInferenceLog
from app.ai_governance.models.risk_assessment import RiskAssessment
from app.ai_governance.models.human_review import HumanReview