import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.ai_governance.api.deps import get_model_registry_service
from app.ai_governance.exceptions.governance_exceptions import (
    ModelIdentifierConflictError,
    ModelNotFoundError,
    RetiredModelCannotBeDefaultError,
)
from app.ai_governance.schemas.ai_model import (
    AIModelCreate,
    AIModelListResponse,
    AIModelResponse,
    AIModelUpdate,
)
from app.ai_governance.services.model_registry import ModelRegistryService
from app.core.auth import current_active_user
from app.models.user import User

router = APIRouter()


@router.post(
    "/",
    response_model=AIModelResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new AI model",
    description=(
        "Registers a new AI model in the governance inventory. "
        "model_identifier + version must be unique."
    ),
)
async def create_model(
    data: AIModelCreate,
    user: User = Depends(current_active_user),
    service: ModelRegistryService = Depends(get_model_registry_service),
) -> AIModelResponse:
    try:
        model = await service.create_model(data, created_by=str(user.id))
        return AIModelResponse.model_validate(model)
    except ModelIdentifierConflictError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.get(
    "/",
    response_model=AIModelListResponse,
    summary="List AI models",
)
async def list_models(
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
    model_status: str | None = Query(None, alias="status", description="Filter by status"),
    service: ModelRegistryService = Depends(get_model_registry_service),
) -> AIModelListResponse:
    items, total = await service.list_models(
        limit=limit, offset=offset, status=model_status
    )
    return AIModelListResponse(
        items=[AIModelResponse.model_validate(m) for m in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/default",
    response_model=AIModelResponse,
    summary="Get the current default AI model",
)
async def get_default_model(
    service: ModelRegistryService = Depends(get_model_registry_service),
) -> AIModelResponse:
    model = await service.get_default_model()
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No default model is currently set.",
        )
    return AIModelResponse.model_validate(model)


@router.get(
    "/{model_id}",
    response_model=AIModelResponse,
    summary="Get a specific AI model",
)
async def get_model(
    model_id: uuid.UUID,
    service: ModelRegistryService = Depends(get_model_registry_service),
) -> AIModelResponse:
    try:
        model = await service.get_model(model_id)
        return AIModelResponse.model_validate(model)
    except ModelNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.patch(
    "/{model_id}",
    response_model=AIModelResponse,
    summary="Update model metadata",
)
async def update_model(
    model_id: uuid.UUID,
    data: AIModelUpdate,
    user: User = Depends(current_active_user),
    service: ModelRegistryService = Depends(get_model_registry_service),
) -> AIModelResponse:
    try:
        model = await service.update_model(model_id, data)
        return AIModelResponse.model_validate(model)
    except ModelNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.patch(
    "/{model_id}/set-default",
    response_model=AIModelResponse,
    summary="Set a model as the system default",
)
async def set_default(
    model_id: uuid.UUID,
    user: User = Depends(current_active_user),
    service: ModelRegistryService = Depends(get_model_registry_service),
) -> AIModelResponse:
    try:
        model = await service.set_default_model(model_id)
        return AIModelResponse.model_validate(model)
    except ModelNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except RetiredModelCannotBeDefaultError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))


@router.patch(
    "/{model_id}/retire",
    response_model=AIModelResponse,
    summary="Retire an AI model",
)
async def retire_model(
    model_id: uuid.UUID,
    user: User = Depends(current_active_user),
    service: ModelRegistryService = Depends(get_model_registry_service),
) -> AIModelResponse:
    try:
        model = await service.retire_model(model_id)
        return AIModelResponse.model_validate(model)
    except ModelNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))


@router.patch(
    "/{model_id}/deprecate",
    response_model=AIModelResponse,
    summary="Deprecate an AI model",
)
async def deprecate_model(
    model_id: uuid.UUID,
    user: User = Depends(current_active_user),
    service: ModelRegistryService = Depends(get_model_registry_service),
) -> AIModelResponse:
    try:
        model = await service.deprecate_model(model_id)
        return AIModelResponse.model_validate(model)
    except ModelNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
