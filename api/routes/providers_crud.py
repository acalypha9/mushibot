import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from auth import get_current_user, require_admin
from database import get_db
from models import ModelProvider, User
from schemas import (
    ModelProviderCreate,
    ModelProviderResponse,
    ModelProviderUpdate,
)

router = APIRouter(prefix="/api/providers", tags=["Model Providers"])


def _mask_provider(provider) -> dict:
    """Convert provider ORM object to response dict with masked API key."""
    resp = ModelProviderResponse.model_validate(provider)
    raw_key = provider.api_key or ""
    resp.has_api_key = bool(raw_key.strip())
    resp.api_key = None
    if raw_key and len(raw_key) > 8:
        resp.masked_api_key = raw_key[:4] + "***" + raw_key[-4:]
    elif raw_key:
        resp.masked_api_key = "***"
    else:
        resp.masked_api_key = None

    # Sanitize model_name: if model_name is missing or hardcoded 'deepseek-v4-pro', resolve from configured_models
    config = provider.config if isinstance(provider.config, dict) else {}
    configured_models = config.get("configured_models", [])
    if isinstance(configured_models, list) and configured_models:
        active_models = [m for m in configured_models if isinstance(m, dict) and m.get("is_active") != False]
        if active_models:
            first_m = active_models[0]
            first_name = str(first_m.get("name") or first_m.get("id") or "").strip()
            current_m = (resp.model_name or "").strip()
            is_in_configured = any(
                str(m.get("name") or m.get("id") or "").strip().lower() == current_m.lower()
                for m in active_models
            )
            if not is_in_configured or current_m.lower() == "deepseek-v4-pro":
                resp.model_name = first_name
    return resp


@router.get("", response_model=List[ModelProviderResponse])
def list_providers(
    category: Optional[str] = Query(None, description="Filter by category: chat, embedding, parser"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    query = db.query(ModelProvider)
    if category:
        query = query.filter(ModelProvider.category == category.lower())
    providers = query.order_by(ModelProvider.is_default.desc(), ModelProvider.created_at.asc()).all()
    return [_mask_provider(p) for p in providers]


@router.post("", response_model=ModelProviderResponse, status_code=status.HTTP_201_CREATED)
def create_provider(
    data: ModelProviderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    category = data.category.lower()
    if category not in ["chat", "embedding", "parser"]:
        raise HTTPException(status_code=400, detail="Invalid category. Must be 'chat', 'embedding', or 'parser'")

    existing_name = db.query(ModelProvider).filter(ModelProvider.name == data.name).first()
    if existing_name:
        raise HTTPException(
            status_code=400,
            detail=f"Provider ID '{data.name}' already exists. Provider source IDs must be unique."
        )

    # If set as default, unset other defaults in same category
    if data.is_default:
        db.query(ModelProvider).filter(ModelProvider.category == category).update({"is_default": False})

    # If first provider in this category, automatically make it default
    existing_count = db.query(ModelProvider).filter(ModelProvider.category == category).count()
    is_default = data.is_default or (existing_count == 0)

    provider = ModelProvider(
        category=category,
        provider_type=data.provider_type,
        name=data.name,
        base_url=data.base_url,
        api_key=data.api_key,
        model_name=data.model_name,
        is_active=data.is_active,
        is_default=is_default,
        config=data.config,
    )
    db.add(provider)
    db.commit()
    db.refresh(provider)
    return _mask_provider(provider)


@router.get("/{provider_id}", response_model=ModelProviderResponse)
def get_provider(
    provider_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    provider = db.query(ModelProvider).filter(ModelProvider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    return _mask_provider(provider)


@router.put("/{provider_id}", response_model=ModelProviderResponse)
def update_provider(
    provider_id: uuid.UUID,
    data: ModelProviderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    provider = db.query(ModelProvider).filter(ModelProvider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    update_dict = data.dict(exclude_unset=True)
    if update_dict.get("api_key") == "":
        update_dict.pop("api_key")

    if "name" in update_dict and update_dict["name"]:
        new_name = update_dict["name"]
        existing_name = db.query(ModelProvider).filter(
            ModelProvider.name == new_name,
            ModelProvider.id != provider_id
        ).first()
        if existing_name:
            raise HTTPException(
                status_code=400,
                detail=f"Provider ID '{new_name}' already exists. Provider source IDs must be unique."
            )

    if "is_default" in update_dict and update_dict["is_default"]:
        db.query(ModelProvider).filter(
            ModelProvider.category == provider.category,
            ModelProvider.id != provider_id,
        ).update({"is_default": False})

    for key, value in update_dict.items():
        setattr(provider, key, value)

    db.commit()
    db.refresh(provider)
    return _mask_provider(provider)


@router.delete("/{provider_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_provider(
    provider_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    provider = db.query(ModelProvider).filter(ModelProvider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    category = provider.category
    was_default = provider.is_default
    db.delete(provider)
    db.commit()

    # If deleted provider was default, pick another one if available
    if was_default:
        next_provider = db.query(ModelProvider).filter(ModelProvider.category == category).first()
        if next_provider:
            next_provider.is_default = True
            db.commit()

    return None


@router.post("/{provider_id}/set-default", response_model=ModelProviderResponse)
def set_default_provider(
    provider_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    provider = db.query(ModelProvider).filter(ModelProvider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    db.query(ModelProvider).filter(ModelProvider.category == provider.category).update({"is_default": False})
    provider.is_default = True
    db.commit()
    db.refresh(provider)
    return _mask_provider(provider)
