import os
import time
import threading
import urllib.parse
from pathlib import Path
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Query
import httpx
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth import require_admin
from config import resolve_docker_url
from database import get_db
from models import ModelProvider, User
from schemas import FetchModelsRequest
from security import validate_safe_url

router = APIRouter(prefix="/api/providers", tags=["Model Providers"])


def get_hf_cache_dir() -> Path:
    hf_home = os.getenv("HF_HOME")
    if hf_home:
        return Path(hf_home) / "hub"
    return Path(os.path.expanduser("~/.cache/huggingface/hub"))


def ensure_cache_dir_ready():
    cache_dir = get_hf_cache_dir()
    try:
        cache_dir.mkdir(parents=True, exist_ok=True)
    except Exception:
        pass


def is_hf_model_downloaded(model_id: str) -> bool:
    if not model_id:
        return False
    cache_dir = get_hf_cache_dir()
    folder_name = "models--" + model_id.replace("/", "--")
    model_folder = cache_dir / folder_name
    if not model_folder.exists():
        return False
    snapshots_dir = model_folder / "snapshots"
    if snapshots_dir.exists():
        try:
            return any(snapshots_dir.iterdir())
        except Exception:
            return False
    return False


class DownloadTask:
    def __init__(self, model_id: str):
        self.model_id = model_id
        self.status = "starting"  # "starting", "downloading", "completed", "error"
        self.progress = 0.0  # percentage 0.0 to 100.0
        self.downloaded_bytes = 0
        self.total_bytes = 0
        self.files_downloaded = 0
        self.total_files = 0
        self.speed = ""
        self.message = "Initializing download..."
        self.error: Optional[str] = None
        self.start_time = time.time()
        self.last_update_time = time.time()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "model_id": self.model_id,
            "status": self.status,
            "progress": self.progress,
            "downloaded_bytes": self.downloaded_bytes,
            "total_bytes": self.total_bytes,
            "files_downloaded": self.files_downloaded,
            "total_files": self.total_files,
            "speed": self.speed,
            "message": self.message,
            "error": self.error,
            "is_downloaded": self.status == "completed" or is_hf_model_downloaded(self.model_id)
        }


active_download_tasks: Dict[str, DownloadTask] = {}
_tasks_lock = threading.Lock()


def enrich_hf_model(m_dict: Dict[str, Any]) -> Dict[str, Any]:
    m_id = m_dict.get("id", "")
    is_down = is_hf_model_downloaded(m_id)
    m_dict["is_downloaded"] = is_down
    with _tasks_lock:
        task = active_download_tasks.get(m_id)
        if task and task.status in ("starting", "downloading"):
            m_dict["is_downloading"] = True
            m_dict["download_progress"] = task.progress
        else:
            m_dict["is_downloading"] = False
            m_dict["download_progress"] = 100.0 if is_down else 0.0
    return m_dict


def make_tracker_tqdm(task: DownloadTask):
    from tqdm.auto import tqdm

    class TrackerTqdm(tqdm):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)
            desc = kwargs.get("desc") or ""
            unit = kwargs.get("unit") or ""
            total = kwargs.get("total") or 0
            if "Fetching" in desc:
                task.total_files = total
                if task.status == "starting":
                    task.status = "downloading"
            elif unit == "B" or "Downloading bytes" in desc or "Reconstructing" in desc:
                if total and total > 0:
                    task.total_bytes = max(task.total_bytes, total)

        def update(self, n=1):
            super().update(n)
            desc = self.desc or ""
            unit = self.unit or ""
            if "Fetching" in desc:
                task.files_downloaded = self.n
                if self.total:
                    task.total_files = self.total
            elif unit == "B" or "Downloading bytes" in desc or "Reconstructing" in desc:
                task.downloaded_bytes = self.n
                if self.total and self.total > 0:
                    task.total_bytes = max(task.total_bytes, self.total)

            if task.total_bytes > 0:
                pct = (task.downloaded_bytes / task.total_bytes) * 100.0
                task.progress = min(99.0, round(pct, 1))
            elif task.total_files > 0:
                pct = (task.files_downloaded / task.total_files) * 100.0
                task.progress = min(99.0, round(pct, 1))

            elapsed = time.time() - task.start_time
            if elapsed > 0 and task.downloaded_bytes > 0:
                rate = task.downloaded_bytes / elapsed
                if rate >= 1024 * 1024:
                    task.speed = f"{rate / (1024 * 1024):.1f} MB/s"
                else:
                    task.speed = f"{rate / 1024:.1f} KB/s"

            task.last_update_time = time.time()

    return TrackerTqdm


def _run_download_task(task: DownloadTask, model_id: str):
    try:
        ensure_cache_dir_ready()

        # Try to query total repo size from HuggingFace API if possible
        try:
            from huggingface_hub import HfApi
            info = HfApi().model_info(model_id, files_metadata=True)
            if info and info.siblings:
                total_s = sum(s.size for s in info.siblings if s.size)
                if total_s > 0:
                    task.total_bytes = total_s
        except Exception:
            pass

        os.environ.pop("HF_HUB_OFFLINE", None)
        os.environ.pop("TRANSFORMERS_OFFLINE", None)
        from huggingface_hub import snapshot_download
        tracker_cls = make_tracker_tqdm(task)
        task.status = "downloading"
        task.message = f"Downloading {model_id}..."

        snapshot_download(repo_id=model_id, tqdm_class=tracker_cls)

        task.status = "completed"
        task.progress = 100.0
        if task.total_bytes > 0:
            task.downloaded_bytes = task.total_bytes
        task.message = f"Downloaded {model_id} successfully"
    except Exception as err:
        task.status = "error"
        task.error = str(err)
        task.message = f"Failed to download {model_id}: {str(err)}"


class DownloadModelRequest(BaseModel):
    model_name: str
    provider_type: Optional[str] = "huggingface"


@router.post("/fetch-models")
async def fetch_models(
    data: FetchModelsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Fetch available models list from base_url/models endpoint.
    """
    base_url = (data.base_url or "").rstrip("/")
    api_key = data.api_key or ""
    if not api_key and data.provider_id:
        provider = db.query(ModelProvider).filter(ModelProvider.id == data.provider_id).first()
        if provider:
            api_key = provider.api_key or ""
    provider_type = (data.provider_type or "").lower()
    headers = {}

    proxy = data.proxy
    if not proxy and data.config and isinstance(data.config, dict):
        proxy = data.config.get("proxy")
    if proxy:
        proxy = resolve_docker_url(proxy)

    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    if provider_type in ["llamaindex", "llama_cloud", "llamaparse"]:
        return {
            "status": "success",
            "models": [
                {"id": "llama-parse", "name": "LlamaParse"},
                {"id": "llama-parse-cost-optimized", "name": "LlamaParse (Cost Optimized)"}
            ]
        }

    if not base_url:
        if provider_type in ["huggingface", "hf"]:
            base_url = "https://huggingface.co/api/models"
        else:
            base_url = "https://api.openai.com/v1"

    is_hf = "huggingface" in base_url or provider_type in ["huggingface", "hf"]

    fallback_hf_models = [
        enrich_hf_model({"id": "BAAI/bge-m3", "name": "BAAI/bge-m3"}),
        enrich_hf_model({"id": "BAAI/bge-large-en-v1.5", "name": "BAAI/bge-large-en-v1.5"}),
        enrich_hf_model({"id": "BAAI/bge-small-en-v1.5", "name": "BAAI/bge-small-en-v1.5"}),
        enrich_hf_model({"id": "sentence-transformers/all-MiniLM-L6-v2", "name": "sentence-transformers/all-MiniLM-L6-v2"}),
        enrich_hf_model({"id": "intfloat/multilingual-e5-large", "name": "intfloat/multilingual-e5-large"}),
        enrich_hf_model({"id": "mixedbread-ai/mxbai-embed-large-v1", "name": "mixedbread-ai/mxbai-embed-large-v1"})
    ]

    if is_hf:
        models_list = []
        seen = set()
        for tag in ["feature-extraction", "sentence-similarity"]:
            try:
                hf_url = f"https://huggingface.co/api/models?pipeline_tag={tag}&sort=downloads&direction=-1&limit=30"
                async with httpx.AsyncClient(timeout=10.0, follow_redirects=False) as client:
                    resp = await client.get(hf_url, headers=headers)
                    if resp.status_code == 200:
                        res_data = resp.json()
                        if isinstance(res_data, list):
                            for m in res_data:
                                if isinstance(m, dict) and "id" in m:
                                    m_id = m["id"]
                                    if m_id not in seen:
                                        seen.add(m_id)
                                        models_list.append(enrich_hf_model({
                                            "id": m_id,
                                            "name": m_id
                                        }))
            except Exception:
                pass

        if not models_list:
            models_list = fallback_hf_models
        return {"status": "success", "models": models_list}

    if "googleapis" in base_url:
        test_url = f"{base_url}/models?key={api_key}"
        headers = {}
    elif base_url.endswith("/models"):
        test_url = base_url
    else:
        test_url = f"{base_url}/models"

    parsed_provider_url = urllib.parse.urlparse(test_url)
    allow_local_provider = parsed_provider_url.hostname in {"localhost", "127.0.0.1", "::1"}
    test_url = resolve_docker_url(test_url) or test_url
    try:
        test_url = validate_safe_url(test_url, allow_private=allow_local_provider)
        if proxy:
            proxy = validate_safe_url(proxy)
    except ValueError as err:
        raise HTTPException(status_code=400, detail="Provider URL targets a private or invalid network") from err

    client_kwargs = {"timeout": 15.0, "follow_redirects": False}
    if proxy:
        client_kwargs["proxy"] = proxy

    def parse_models_response(res_data):
        models_list = []
        if isinstance(res_data, list):
            for m in res_data:
                if isinstance(m, dict):
                    m_id = m.get("id") or m.get("modelId") or m.get("name")
                    if m_id:
                        models_list.append({"id": m_id, "name": m_id})
                elif isinstance(m, str):
                    models_list.append({"id": m, "name": m})
        elif isinstance(res_data, dict):
            if "data" in res_data and isinstance(res_data["data"], list):
                for m in res_data["data"]:
                    m_id = m.get("id") if isinstance(m, dict) else str(m)
                    if m_id:
                        models_list.append({"id": m_id, "name": m_id})
            elif "models" in res_data and isinstance(res_data["models"], list):
                for m in res_data["models"]:
                    m_id = m.get("name") if isinstance(m, dict) else str(m)
                    if m_id:
                        models_list.append({"id": m_id, "name": m_id})
        return models_list

    try:
        async with httpx.AsyncClient(**client_kwargs) as client:
            resp = await client.get(test_url, headers=headers)
            if resp.status_code == 200:
                res_data = resp.json()
                return {"status": "success", "models": parse_models_response(res_data)}
            else:
                return {
                    "status": "error",
                    "message": f"Server returned status code {resp.status_code}",
                    "models": []
                }
    except Exception as first_err:
        return {
            "status": "error",
            "message": str(first_err),
            "models": []
        }


@router.post("/download-model")
async def download_model(
    data: DownloadModelRequest,
    current_user: User = Depends(require_admin),
):
    """
    Pre-download Hugging Face embedding model to local cache (~/.cache/huggingface/hub).
    """
    model_id = data.model_name
    if not model_id:
        raise HTTPException(status_code=400, detail="Model name is required")

    if is_hf_model_downloaded(model_id):
        return {
            "status": "completed",
            "message": f"Model {model_id} is already downloaded",
            "model_id": model_id,
            "progress": 100.0,
            "is_downloaded": True
        }

    with _tasks_lock:
        task = active_download_tasks.get(model_id)
        if task and task.status in ("starting", "downloading"):
            return {
                "status": "downloading",
                "message": f"Download for {model_id} is already in progress",
                "model_id": model_id,
                "progress": task.progress,
                "is_downloaded": False
            }

        task = DownloadTask(model_id)
        active_download_tasks[model_id] = task

    thread = threading.Thread(
        target=_run_download_task,
        args=(task, model_id),
        daemon=True
    )
    thread.start()

    return {
        "status": "started",
        "message": f"Download started for {model_id}",
        "model_id": model_id,
        "progress": 0.0,
        "is_downloaded": False
    }


@router.get("/download-progress")
async def get_download_progress(
    model_id: Optional[str] = Query(None),
    current_user: User = Depends(require_admin),
):
    """
    Get live progress of active model download(s).
    """
    if model_id:
        with _tasks_lock:
            task = active_download_tasks.get(model_id)
        if task:
            return task.to_dict()

        if is_hf_model_downloaded(model_id):
            return {
                "model_id": model_id,
                "status": "completed",
                "progress": 100.0,
                "is_downloaded": True,
                "message": f"Model {model_id} is downloaded"
            }

        return {
            "model_id": model_id,
            "status": "not_found",
            "progress": 0.0,
            "is_downloaded": False,
            "message": "No active download task"
        }

    with _tasks_lock:
        all_tasks = [t.to_dict() for t in active_download_tasks.values()]
    return {"downloads": all_tasks}
