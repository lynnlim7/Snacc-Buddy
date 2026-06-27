import ipaddress
import uuid
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import current_active_user
from app.core.database import get_db
from app.models.user import User
from app.nutrition_coach.models.recipe import Recipe
from app.schemas.coach import RecipeMetadataResponse

router = APIRouter()


def _validate_source_url(url: str | None) -> str | None:
    """Return the URL if it is safe to expose to a client, otherwise None.

    Checks:
    - Non-empty and parseable
    - Scheme must be http or https
    - Hostname must be present and not a private/loopback address
    - Raw IP addresses are rejected (recipe sites use hostnames)
    """
    if not url:
        return None
    try:
        parsed = urlparse(url)
    except Exception:
        return None

    if parsed.scheme not in ("http", "https"):
        return None

    host = (parsed.hostname or "").lower()
    if not host:
        return None

    try:
        # Reject any raw IP address (private or public)
        ipaddress.ip_address(host)
        return None
    except ValueError:
        pass  # it's a hostname — proceed

    # Reject loopback / RFC-1918 / link-local by name
    if host in ("localhost",) or host.endswith(".local"):
        return None

    return url


@router.get("/{recipe_id}", response_model=RecipeMetadataResponse)
async def get_recipe_metadata(
    recipe_id: str,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_db),
) -> RecipeMetadataResponse:
    """Return lightweight metadata for a recipe, including a validated source URL.

    The `source_url` field is only present when the URL passes safety validation.
    Used by the frontend "View Full Recipe" button to open the recipe in-app.
    """
    try:
        rid = uuid.UUID(recipe_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid recipe ID format.",
        )

    result = await db.execute(select(Recipe).where(Recipe.id == rid))
    recipe = result.scalar_one_or_none()
    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipe not found.",
        )

    return RecipeMetadataResponse(
        id=str(recipe.id),
        title=recipe.title,
        calories=recipe.calories,
        protein_g=recipe.protein_g,
        carbs_g=recipe.carbs_g,
        fat_g=recipe.fat_g,
        fibre_g=recipe.fibre_g,
        diet_tags=recipe.diet_tags or [],
        cuisine_type=recipe.cuisine_type,
        source_url=_validate_source_url(recipe.source_url),
    )
