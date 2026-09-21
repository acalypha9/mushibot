import os
import json
import uuid
from typing import Optional
from langchain_huggingface import HuggingFaceEmbeddings
from config import resolve_docker_url

# -----------------------------------------------------------------------------
# Global Singleton Cache for LangChain Embeddings & PGVector Stores
# -----------------------------------------------------------------------------
_embeddings_cache_key = None
_embeddings_instance = None
_vector_stores_cache = {}


def get_active_embedding_config(db=None):
    """
    Fetch the active Embedding Model Provider configuration from database.
    """
    close_db = False
    if db is None:
        try:
            from database import SessionLocal
            db = SessionLocal()
            close_db = True
        except Exception as e:
            print(f"[WARN] Failed to open DB session for embedding config: {e}", flush=True)
            db = None

    try:
        if db:
            from models import ModelProvider
            provider = db.query(ModelProvider).filter(
                ModelProvider.category == "embedding",
                ModelProvider.is_active == True,
                ModelProvider.is_default == True
            ).first()

            if not provider:
                provider = db.query(ModelProvider).filter(
                    ModelProvider.category == "embedding",
                    ModelProvider.is_active == True
                ).first()

            if provider:
                model_name = provider.model_name
                config_dict = provider.config if isinstance(provider.config, dict) else {}
                configured_models = config_dict.get("configured_models", [])
                
                active_m = next((m for m in configured_models if isinstance(m, dict) and m.get("is_active")), None)
                if not active_m and configured_models and isinstance(configured_models[0], dict):
                    active_m = configured_models[0]

                if active_m:
                    model_name = active_m.get("name") or active_m.get("id") or model_name

                if model_name and model_name.strip():
                    device = (active_m.get("device") if active_m else None) or config_dict.get("device") or "gpu"
                    normalize_emb = (active_m.get("normalize_embeddings") if active_m and "normalize_embeddings" in active_m else None)
                    if normalize_emb is None:
                        normalize_emb = config_dict.get("normalize_embeddings", True)

                    model_kwargs = config_dict.get("model_kwargs") or {"device": device}
                    if isinstance(model_kwargs, dict):
                        model_kwargs["device"] = device

                    encode_kwargs = config_dict.get("encode_kwargs") or {"normalize_embeddings": bool(normalize_emb)}
                    if isinstance(encode_kwargs, dict):
                        encode_kwargs["normalize_embeddings"] = bool(normalize_emb)

                    return {
                        "provider_type": (provider.provider_type or "huggingface").lower(),
                        "model_name": model_name.strip(),
                        "api_key": provider.api_key or "",
                        "base_url": (provider.base_url or "").rstrip("/"),
                        "model_kwargs": model_kwargs,
                        "encode_kwargs": encode_kwargs
                    }
    except Exception as err:
        print(f"[WARN] Error fetching active embedding provider from DB: {err}", flush=True)
    finally:
        if close_db and db:
            db.close()

    raise ValueError("Embedding model provider is not configured. Please set up an embedding model in Dashboard > Providers.")


def get_active_parser_config(db=None):
    """
    Fetch the active Parser Model Provider configuration from database.
    """
    close_db = False
    if db is None:
        try:
            from database import SessionLocal
            db = SessionLocal()
            close_db = True
        except Exception as e:
            print(f"[WARN] Failed to open DB session for parser config: {e}", flush=True)
            db = None

    try:
        if db:
            from models import ModelProvider
            provider = db.query(ModelProvider).filter(
                ModelProvider.category == "parser",
                ModelProvider.is_active == True,
                ModelProvider.is_default == True
            ).first()

            if not provider:
                provider = db.query(ModelProvider).filter(
                    ModelProvider.category == "parser",
                    ModelProvider.is_active == True
                ).first()

            if provider:
                model_name = provider.model_name
                config_dict = provider.config if isinstance(provider.config, dict) else {}
                configured_models = config_dict.get("configured_models", [])
                
                active_m = next((m for m in configured_models if isinstance(m, dict) and m.get("is_active")), None)
                if not active_m and configured_models and isinstance(configured_models[0], dict):
                    active_m = configured_models[0]

                if active_m:
                    model_name = active_m.get("name") or active_m.get("id") or model_name

                tier = (active_m.get("tier") if active_m else None) or config_dict.get("tier") or "agentic"
                version = (active_m.get("version") if active_m else None) or config_dict.get("version") or "latest"
                
                output_tables = (active_m.get("output_tables_as_markdown") if active_m and "output_tables_as_markdown" in active_m else None)
                if output_tables is None:
                    output_tables = config_dict.get("output_tables_as_markdown", True)
                
                compact_tables = (active_m.get("compact_markdown_tables") if active_m and "compact_markdown_tables" in active_m else None)
                if compact_tables is None:
                    compact_tables = config_dict.get("compact_markdown_tables", True)
                
                disable_cache = (active_m.get("disable_cache") if active_m and "disable_cache" in active_m else None)
                if disable_cache is None:
                    disable_cache = config_dict.get("disable_cache", False)

                page_ranges = (active_m.get("page_ranges") if active_m else None) or config_dict.get("page_ranges", "")

                return {
                    "provider_type": (provider.provider_type or "llamaindex").lower(),
                    "name": provider.name or "LlamaIndex",
                    "model_name": model_name or "llama-parse",
                    "api_key": provider.api_key or "",
                    "base_url": (provider.base_url or "").rstrip("/"),
                    "tier": tier,
                    "version": version,
                    "output_tables_as_markdown": bool(output_tables),
                    "compact_markdown_tables": bool(compact_tables),
                    "disable_cache": bool(disable_cache),
                    "page_ranges": page_ranges or None,
                    "config": config_dict
                }
    except Exception as err:
        print(f"[WARN] Error fetching active parser provider from DB: {err}", flush=True)
    finally:
        if close_db and db:
            db.close()

    # Fallback to env var if no provider in DB
    return {
        "provider_type": "llamaindex",
        "name": "LlamaIndex",
        "model_name": "llama-parse",
        "api_key": os.getenv("LLAMA_CLOUD_API_KEY", ""),
        "base_url": "https://api.cloud.llamaindex.ai",
        "tier": "agentic",
        "version": "latest",
        "output_tables_as_markdown": True,
        "compact_markdown_tables": True,
        "disable_cache": False,
        "page_ranges": None,
        "config": {}
    }



def get_embeddings(db=None):
    """
    Instantiate Embeddings model based on active settings in Dashboard > Providers.
    """
    global _embeddings_instance, _embeddings_cache_key

    config = get_active_embedding_config(db)
    provider_type = config["provider_type"]
    model_name = config["model_name"]
    api_key = config["api_key"]
    base_url = resolve_docker_url(config["base_url"]) or config["base_url"]

    user_model_kwargs = config.get("model_kwargs") or {}
    user_encode_kwargs = config.get("encode_kwargs") or {}

    cache_key = f"{provider_type}:{model_name}:{api_key}:{base_url}:{json.dumps(user_model_kwargs)}:{json.dumps(user_encode_kwargs)}"

    if _embeddings_instance is not None and _embeddings_cache_key == cache_key:
        return _embeddings_instance

    print(f"[INFO] Initializing Embeddings provider '{provider_type}' with model '{model_name}'...", flush=True)

    if provider_type in ["huggingface", "hf"]:
        os.environ.pop("HF_HUB_OFFLINE", None)
        os.environ.pop("TRANSFORMERS_OFFLINE", None)

        chosen_device = (user_model_kwargs.get("device") or "gpu").lower()
        encode_kwargs = {"normalize_embeddings": user_encode_kwargs.get("normalize_embeddings", True)}
        for k, v in user_encode_kwargs.items():
            if k != "normalize_embeddings":
                encode_kwargs[k] = v

        instance = None
        if chosen_device in ["gpu", "cuda"]:
            try:
                import torch
                if torch.cuda.is_available():
                    print(f"[INFO] Initializing HuggingFaceEmbeddings ('{model_name}') on GPU (cuda)...", flush=True)
                    instance = HuggingFaceEmbeddings(
                        model_name=model_name,
                        model_kwargs={"device": "cuda"},
                        encode_kwargs=encode_kwargs
                    )
            except Exception as err:
                print(f"[INFO] GPU embedding initialization error ({err}), falling back to CPU...", flush=True)
                instance = None

        if instance is None:
            print(f"[INFO] Initializing HuggingFaceEmbeddings ('{model_name}') on CPU...", flush=True)
            instance = HuggingFaceEmbeddings(
                model_name=model_name,
                model_kwargs={"device": "cpu"},
                encode_kwargs=encode_kwargs
            )

    elif provider_type in ["openai", "openai_compatible", "deepseek", "openrouter"]:
        from langchain_openai import OpenAIEmbeddings
        url = resolve_docker_url(base_url if base_url else "https://api.openai.com/v1")
        instance = OpenAIEmbeddings(
            model=model_name,
            openai_api_key=api_key or "sk-dummy",
            openai_api_base=url
        )

    elif provider_type == "gemini":
        try:
            from langchain_google_genai import GoogleGenerativeAIEmbeddings
            instance = GoogleGenerativeAIEmbeddings(
                model=model_name if "gemini" in model_name or "text-embedding" in model_name else "models/text-embedding-004",
                google_api_key=api_key
            )
        except Exception:
            from langchain_openai import OpenAIEmbeddings
            url = resolve_docker_url(base_url if base_url else "https://generativelanguage.googleapis.com/v1beta")
            instance = OpenAIEmbeddings(
                model=model_name,
                openai_api_key=api_key,
                openai_api_base=url
            )

    elif provider_type == "ollama":
        try:
            from langchain_ollama import OllamaEmbeddings
            url = resolve_docker_url(base_url if base_url else "http://localhost:11434")
            instance = OllamaEmbeddings(
                model=model_name,
                base_url=url
            )
        except Exception:
            from langchain_openai import OpenAIEmbeddings
            url = resolve_docker_url(base_url if base_url else "http://localhost:11434/v1")
            instance = OpenAIEmbeddings(
                model=model_name,
                openai_api_key="ollama",
                openai_api_base=url
            )

    else:
        # Default fallback to HuggingFace Embeddings
        try:
            import torch
            device = "cuda" if torch.cuda.is_available() else "cpu"
        except ImportError:
            device = "cpu"

        os.environ.pop("HF_HUB_OFFLINE", None)
        os.environ.pop("TRANSFORMERS_OFFLINE", None)

        model_kwargs = {"device": device}
        encode_kwargs = {"normalize_embeddings": True}

        print(f"[INFO] Initializing HuggingFaceEmbeddings ('{model_name}') on device: {device}", flush=True)
        instance = HuggingFaceEmbeddings(
            model_name=model_name,
            model_kwargs=model_kwargs,
            encode_kwargs=encode_kwargs
        )

    _embeddings_instance = instance
    _embeddings_cache_key = cache_key
    return _embeddings_instance


def get_vector_store(collection_name: str, db=None):
    """
    Get cached PGVector store for collection_name using active database embeddings.
    """
    from langchain_postgres.vectorstores import PGVector
    
    embeddings = get_embeddings(db)
    cache_entry = _vector_stores_cache.get(collection_name)
    if not cache_entry or getattr(cache_entry, "_cached_embeddings_key", None) != _embeddings_cache_key:
        from config import DATABASE_URL
        connection = DATABASE_URL
        vs = PGVector(
            embeddings=embeddings,
            collection_name=collection_name,
            connection=connection,
            use_jsonb=True,
        )
        setattr(vs, "_cached_embeddings_key", _embeddings_cache_key)
        _vector_stores_cache[collection_name] = vs

    return _vector_stores_cache[collection_name]


def get_collections_info() -> str:
    """Retrieve ONLY active knowledge base collections and their descriptions/document topics from database."""
    import uuid
    from database import SessionLocal
    from models import KnowledgeCollection, KnowledgeDocument, SystemSetting

    try:
        get_active_embedding_config()
    except ValueError as val_err:
        print(f"[WARN] get_collections_info: {val_err}", flush=True)
        return json.dumps([{"message": "No collections available in the knowledge base."}])

    db = SessionLocal()
    try:
        active_setting = db.query(SystemSetting).filter(SystemSetting.key == "active_collection_id").first()
        active_uuids = []
        if active_setting and active_setting.value:
            raw_ids = [s.strip() for s in active_setting.value.split(",") if s.strip()]
            for cid in raw_ids:
                try:
                    active_uuids.append(uuid.UUID(cid))
                except Exception:
                    pass

        if not active_uuids:
            return json.dumps([{"message": "No active collections available in the knowledge base."}])

        collections = (
            db.query(KnowledgeCollection)
            .filter(KnowledgeCollection.id.in_(active_uuids))
            .order_by(KnowledgeCollection.name.asc())
            .all()
        )

        result = []
        for col in collections:
            meta = col.cmetadata or {}
            desc = meta.get("description", "")
            docs = (
                db.query(KnowledgeDocument.title)
                .filter(KnowledgeDocument.collection_id == col.id)
                .all()
            )
            clean_topics = [d.title for d in docs if d.title]
            result.append({
                "collection_name": col.name,
                "description": desc,
                "available_topics": clean_topics if clean_topics else ["General Information"],
                "topics": clean_topics if clean_topics else ["General Information"]
            })
        if not result:
            return json.dumps([{"message": "No active collections available."}])
        return json.dumps(result)
    except Exception as err:
        print(f"Error fetching collection info: {err}", flush=True)
        return json.dumps([{"message": "No collections available in the knowledge base."}])
    finally:
        db.close()


def vector_search(query: str, collection_name: str = None, top_k: Optional[int] = None) -> str:
    """Helper function to perform semantic search using cached pgvector vector store."""
    import uuid
    from database import SessionLocal
    from models import SystemSetting, KnowledgeCollection

    target_cols: list[str] = []
    if collection_name:
        target_cols = [collection_name]
    else:
        db = SessionLocal()
        try:
            active_setting = db.query(SystemSetting).filter(SystemSetting.key == "active_collection_id").first()
            if active_setting and active_setting.value:
                raw_ids = [s.strip() for s in active_setting.value.split(",") if s.strip()]
                for cid in raw_ids:
                    try:
                        col = db.query(KnowledgeCollection).filter(KnowledgeCollection.id == uuid.UUID(cid)).first()
                        if col and col.name not in target_cols:
                            target_cols.append(col.name)
                    except Exception:
                        pass
        except Exception as e:
            print(f"Error fetching active collection setting: {e}", flush=True)
        finally:
            db.close()

    if not target_cols:
        return json.dumps([{"error": "No active knowledge collection is configured. Please set up a collection first."}])

    k_val = top_k

    # Determine k value for retrieval: param top_k -> SystemSetting 'retrieval_top_k' -> fallback 3
    if not k_val or k_val <= 0:
        db_k = SessionLocal()
        try:
            k_setting = db_k.query(SystemSetting).filter(SystemSetting.key == "retrieval_top_k").first()
            if k_setting and k_setting.value:
                try:
                    k_val = int(k_setting.value)
                except ValueError:
                    pass
        except Exception as e:
            print(f"Error fetching retrieval_top_k setting: {e}", flush=True)
        finally:
            db_k.close()

    if not k_val or k_val <= 0:
        k_val = 3

    all_results = []
    for target_col in target_cols:
        db2 = SessionLocal()
        try:
            from sqlalchemy import func
            exists = db2.query(KnowledgeCollection).filter(func.lower(KnowledgeCollection.name) == func.lower(target_col)).first()
            if not exists:
                print(f"[WARN] Collection '{target_col}' does not exist — skipping.", flush=True)
                continue
            t_col_name = exists.name
        finally:
            db2.close()

        try:
            vector_store = get_vector_store(t_col_name)
            print(f"[RETRIEVAL SEARCH] Querying '{t_col_name}' with k={k_val}", flush=True)
            results = vector_store.similarity_search(query, k=k_val)
            for res in results:
                all_results.append({"content": res.page_content})
        except Exception as err:
            err_msg = str(err)
            if "different vector dimensions" in err_msg:
                import re
                match = re.search(r"different vector dimensions (\d+) and (\d+)", err_msg)
                if match:
                    stored_dim, current_dim = match.group(1), match.group(2)
                    err_msg = (
                        f"Vector dimension mismatch in '{t_col_name}': {stored_dim} vs {current_dim}. "
                        f"Please re-upload documents or switch embedding model."
                    )
            print(f"[WARN] Retrieval error in collection '{target_col}': {err_msg}", flush=True)

    if not all_results:
        return json.dumps([{"error": "No matching knowledge items found in active collections."}])

    return json.dumps(all_results[: k_val * len(target_cols)])
