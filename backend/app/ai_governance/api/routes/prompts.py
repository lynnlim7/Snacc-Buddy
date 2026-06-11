import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.ai_governance.api.deps import get_prompt_registry_service
from app.ai_governance.exceptions.governance_exceptions import (
    ActivePromptImmutableError,
    ModelNotFoundError,
    NoActivePromptError,
    PromptNotFoundError,
)
from app.ai_governance.schemas.prompt_version import (
    PromptVersionCreate,
    PromptVersionListResponse,
    PromptVersionResponse,
)
from app.ai_governance.services.prompt_registry import PromptRegistryService
from app.core.auth import current_active_user
from app.models.user import User

router = APIRouter()


@router.post(
    "/",
    response_model=PromptVersionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new prompt version (starts as DRAFT)",
)
async def create_prompt_version(
    data: PromptVersionCreate,
    user: User = Depends(current_active_user),
    service: PromptRegistryService = Depends(get_prompt_registry_service),
) -> PromptVersionResponse:
    try:
        prompt = await service.create_prompt_version(data, created_by=str(user.id))
        return PromptVersionResponse.model_validate(prompt)
    except ModelNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get(
    "/",
    response_model=PromptVersionListResponse,
    summary="List prompt versions for a model",
)
async def list_prompt_versions(
    model_id: uuid.UUID,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
    service: PromptRegistryService = Depends(get_prompt_registry_service),
) -> PromptVersionListResponse:
    items, total = await service.get_prompt_history(model_id, limit, offset)
    return PromptVersionListResponse(
        items=[PromptVersionResponse.model_validate(p) for p in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/active",
    response_model=PromptVersionResponse,
    summary="Get active prompt for a model",
)
async def get_active_prompt(
    model_id: uuid.UUID,
    service: PromptRegistryService = Depends(get_prompt_registry_service),
) -> PromptVersionResponse:
    try:
        prompt = await service.get_active_prompt(model_id)
        return PromptVersionResponse.model_validate(prompt)
    except NoActivePromptError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get(
    "/{prompt_id}",
    response_model=PromptVersionResponse,
    summary="Get a specific prompt version",
)
async def get_prompt(
    prompt_id: uuid.UUID,
    service: PromptRegistryService = Depends(get_prompt_registry_service),
) -> PromptVersionResponse:
    try:
        prompt = await service.get_prompt(prompt_id)
        return PromptVersionResponse.model_validate(prompt)
    except PromptNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.patch(
    "/{prompt_id}/activate",
    response_model=PromptVersionResponse,
    summary="Activate a prompt version (retires the current active)",
)
async def activate_prompt(
    prompt_id: uuid.UUID,
    user: User = Depends(current_active_user),
    service: PromptRegistryService = Depends(get_prompt_registry_service),
) -> PromptVersionResponse:
    try:
        prompt = await service.activate_prompt(prompt_id)
        return PromptVersionResponse.model_validate(prompt)
    except PromptNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ActivePromptImmutableError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))


@router.patch(
    "/{prompt_id}/retire",
    response_model=PromptVersionResponse,
    summary="Retire a prompt version",
)
async def retire_prompt(
    prompt_id: uuid.UUID,
    user: User = Depends(current_active_user),
    service: PromptRegistryService = Depends(get_prompt_registry_service),
) -> PromptVersionResponse:
    try:
        prompt = await service.retire_prompt(prompt_id)
        return PromptVersionResponse.model_validate(prompt)
    except PromptNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
