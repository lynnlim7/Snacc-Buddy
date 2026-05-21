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
    lifestyle: Optional[str] = None
    has_dietary_restrictions: Optional[bool] = None
    has_conditions: Optional[bool] = None
    condition_type: Optional[str] = None


class UserCreate(schemas.BaseUserCreate):
    name: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[int] = None
    height_cm: Optional[float] = None
    current_weight_kg: Optional[float] = None
    goal_weight_kg: Optional[float] = None
    goal: Optional[str] = None
    lifestyle: Optional[str] = None
    has_dietary_restrictions: Optional[bool] = None
    has_conditions: Optional[bool] = None
    condition_type: Optional[str] = None


class UserUpdate(schemas.BaseUserUpdate):
    name: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[int] = None
    height_cm: Optional[float] = None
    current_weight_kg: Optional[float] = None
    goal_weight_kg: Optional[float] = None
    goal: Optional[str] = None
    lifestyle: Optional[str] = None
    has_dietary_restrictions: Optional[bool] = None
    has_conditions: Optional[bool] = None
    condition_type: Optional[str] = None