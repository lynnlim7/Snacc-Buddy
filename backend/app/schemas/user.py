import uuid
from typing import Optional

from fastapi_users import schemas


class UserRead(schemas.BaseUser[uuid.UUID]):
    name: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[int] = None
    height_cm: Optional[float] = None
    current_weight_kg: Optional[float] = None
    goal_weight_kg: Optional[float] = None
    goal: Optional[str] = None
    mindset: Optional[str] = None
    pace: Optional[str] = None
    lifestyle: Optional[str] = None
    has_dietary_restrictions: Optional[bool] = None
    dietary: Optional[list[str]] = None
    conditions: Optional[list[str]] = None
    custom_condition: Optional[str] = None


class UserCreate(schemas.BaseUserCreate):
    name: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[int] = None
    height_cm: Optional[float] = None
    current_weight_kg: Optional[float] = None
    goal_weight_kg: Optional[float] = None
    goal: Optional[str] = None
    mindset: Optional[str] = None
    pace: Optional[str] = None
    lifestyle: Optional[str] = None
    has_dietary_restrictions: Optional[bool] = None
    dietary: Optional[list[str]] = None
    conditions: Optional[list[str]] = None
    custom_condition: Optional[str] = None


class UserUpdate(schemas.BaseUserUpdate):
    name: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[int] = None
    height_cm: Optional[float] = None
    current_weight_kg: Optional[float] = None
    goal_weight_kg: Optional[float] = None
    goal: Optional[str] = None
    mindset: Optional[str] = None
    pace: Optional[str] = None
    lifestyle: Optional[str] = None
    has_dietary_restrictions: Optional[bool] = None
    dietary: Optional[list[str]] = None
    conditions: Optional[list[str]] = None
    custom_condition: Optional[str] = None