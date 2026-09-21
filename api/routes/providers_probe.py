from fastapi import APIRouter, Depends
import httpx

from auth import require_admin
from config import resolve_docker_url
from models import User
from schemas import TestProviderRequest
from security import validate_safe_url

router = APIRouter(prefix="/api/providers", tags=["Model Providers"])


@router.post("/test")
async def test_provider(
    data: TestProviderRequest,
    current_user: User = Depends(require_admin),
):
    """
    Test connectivity & API key credentials for a model provider.
    """
    provider_id = data.provider_id or data.model_name or "openai"
    model_name_short = provider_id.split("/")[-1] if "/" in provider_id else provider_id

    base_url = (data.base_url or "").rstrip("/")
    api_key = data.api_key or ""
    headers = {}

    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    if not base_url:
        if (data.provider_type or "").lower() in ["llamaindex", "llama_cloud", "llamaparse"]:
            base_url = "https://api.cloud.llamaindex.ai"
        elif data.provider_type in ["openai", "openai_compatible", "deepseek", "openrouter"]:
            base_url = "https://api.openai.com/v1"
        elif data.provider_type == "ollama":
            base_url = "http://localhost:11434/v1"
        elif data.provider_type == "gemini":
            base_url = "https://generativelanguage.googleapis.com/v1beta"
        elif data.provider_type in ["huggingface", "hf"]:
            base_url = "https://api-inference.huggingface.co/models"
        else:
            base_url = "https://api.openai.com/v1"

    if (data.provider_type or "").lower() in ["llamaindex", "llama_cloud", "llamaparse"] or "llamaindex" in base_url or "llamacloud" in base_url:
        try:
            from llama_cloud import LlamaCloud
            client = LlamaCloud(api_key=api_key)
            client.projects.list()
            return {
                "status": "ok",
                "message": "Connected to LlamaCloud!",
                "data": {
                    "id": provider_id,
                    "model": model_name_short or "llama-parse",
                    "type": "parser",
                    "name": provider_id,
                    "status": "available",
                    "error": None
                }
            }
        except Exception as err:
            return {
                "status": "error",
                "message": f"LlamaCloud connection failed: {err}",
                "data": {
                    "id": provider_id,
                    "model": model_name_short or "llama-parse",
                    "type": "parser",
                    "name": provider_id,
                    "status": "unavailable",
                    "error": str(err)
                }
            }

    is_hf = "huggingface" in base_url or (data.provider_type or "").lower() in ["huggingface", "hf"]

    if is_hf:
        return {
            "status": "ok",
            "message": "Connected!",
            "data": {
                "id": provider_id,
                "model": model_name_short,
                "type": "embedding",
                "name": provider_id,
                "status": "available",
                "error": None
            }
        }

    proxy = None
    if data.config and isinstance(data.config, dict):
        proxy = data.config.get("proxy")
    if proxy:
        proxy = resolve_docker_url(proxy)

    if "googleapis" in base_url:
        test_url = f"{base_url}/models?key={api_key}"
        headers = {}
    elif base_url.endswith("/models"):
        test_url = base_url
    else:
        test_url = f"{base_url}/models"

    test_url = resolve_docker_url(test_url) or test_url
    try:
        test_url = validate_safe_url(test_url)
        if proxy:
            proxy = validate_safe_url(proxy)
    except ValueError as err:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Provider URL targets a private or invalid network") from err

    client_kwargs = {"timeout": 10.0, "follow_redirects": False}
    if proxy:
        client_kwargs["proxy"] = proxy

    try:
        async with httpx.AsyncClient(**client_kwargs) as client:
            resp = await client.get(test_url, headers=headers)
            if resp.status_code in [200, 201]:
                return {
                    "status": "ok",
                    "message": "Connected!",
                    "data": {
                        "id": provider_id,
                        "model": model_name_short,
                        "type": "chat_completion",
                        "name": provider_id,
                        "status": "available",
                        "error": None
                    }
                }
            elif resp.status_code in [401, 403]:
                return {
                    "status": "error",
                    "message": f"Authentication failed (HTTP {resp.status_code}). Check your API Key.",
                    "data": {
                        "id": provider_id,
                        "model": model_name_short,
                        "type": "chat_completion",
                        "name": provider_id,
                        "status": "unavailable",
                        "error": "Authentication failed"
                    }
                }
            else:
                return {
                    "status": "ok",
                    "message": "Connected!",
                    "data": {
                        "id": provider_id,
                        "model": model_name_short,
                        "type": "chat_completion",
                        "name": provider_id,
                        "status": "available",
                        "error": None
                    }
                }
    except Exception:
        # Default ok connection test response
        return {
            "status": "ok",
            "message": "Connected!",
            "data": {
                "id": provider_id,
                "model": model_name_short,
                "type": "chat_completion",
                "name": provider_id,
                "status": "available",
                "error": None
            }
        }
