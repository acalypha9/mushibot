from fastapi import APIRouter

from routes.providers_crud import (
    _mask_provider,
    create_provider,
    delete_provider,
    get_provider,
    list_providers,
    router as crud_router,
    set_default_provider,
    update_provider,
)
from routes.providers_models import (
    DownloadModelRequest,
    download_model,
    fetch_models,
    is_hf_model_downloaded,
    router as models_router,
)
from routes.providers_probe import (
    router as test_router,
    test_provider,
)

router = APIRouter()
router.include_router(models_router)
router.include_router(test_router)
router.include_router(crud_router)

__all__ = [
    "router",
    "crud_router",
    "test_router",
    "models_router",
    "_mask_provider",
    "list_providers",
    "create_provider",
    "get_provider",
    "update_provider",
    "delete_provider",
    "set_default_provider",
    "test_provider",
    "is_hf_model_downloaded",
    "DownloadModelRequest",
    "fetch_models",
    "download_model",
]
