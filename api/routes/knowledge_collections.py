import datetime, os, re, uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, text
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from auth import require_admin
from database import get_db
from models import KnowledgeCollection, KnowledgeDocument, ModelProvider, SystemSetting, User
from schemas import (
    CollectionCreate, CollectionResponse, CollectionUpdate,
    RetrievalRequest, SettingsResponse, SettingsUpdate,
)

router = APIRouter()

def get_setting(db: Session, key: str, default: str = "") -> str:
    s = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    return s.value if s else default

def set_setting(db: Session, key: str, value: str) -> None:
    s = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if not s: db.add(SystemSetting(key=key, value=value))
    else: s.value = value
    db.commit()

def touch_collection(db: Session, col_id: uuid.UUID) -> None:
    col = db.query(KnowledgeCollection).filter(KnowledgeCollection.id == col_id).first()
    if not col: return
    meta = col.cmetadata if isinstance(col.cmetadata, dict) else {}
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    meta["created_at"] = meta.get("created_at") or now
    meta["updated_at"] = now
    col.cmetadata = meta
    db.commit()

def make_col_response(col: KnowledgeCollection, db: Session) -> CollectionResponse:
    doc_count = db.query(KnowledgeDocument).filter(KnowledgeDocument.collection_id == col.id).count()
    doc_chunks = db.query(func.sum(KnowledgeDocument.chunk_count)).filter(KnowledgeDocument.collection_id == col.id).scalar() or 0
    pg_chunks = 0
    try:
        pg_chunks = db.execute(text("SELECT count(*) FROM langchain_pg_embedding WHERE collection_id = :col_id"), {"col_id": str(col.id)}).scalar() or 0
    except Exception:
        db.rollback()
        pg_chunks = 0
    meta = col.cmetadata if isinstance(col.cmetadata, dict) else {}
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    created_at = meta.get("created_at")
    if not created_at:
        d = db.query(KnowledgeDocument).filter(KnowledgeDocument.collection_id == col.id).order_by(KnowledgeDocument.created_at.asc()).first()
        created_at = d.created_at.isoformat() if (d and d.created_at) else now
        meta["created_at"] = created_at
        col.cmetadata = meta
        try:
            db.commit()
        except Exception:
            db.rollback()
    updated_at = meta.get("updated_at")
    if not updated_at:
        d = db.query(KnowledgeDocument).filter(KnowledgeDocument.collection_id == col.id).order_by(KnowledgeDocument.updated_at.desc()).first()
        updated_at = d.updated_at.isoformat() if (d and d.updated_at) else created_at
        meta["updated_at"] = updated_at
        col.cmetadata = meta
        try:
            db.commit()
        except Exception:
            db.rollback()
    emb_dim = None
    try:
        dim_val = db.execute(text("SELECT vector_dims(embedding) FROM langchain_pg_embedding WHERE collection_id = :col_id LIMIT 1"), {"col_id": str(col.id)}).scalar()
        emb_dim = int(dim_val) if dim_val is not None else None
    except Exception:
        db.rollback()
    if emb_dim is None:
        emb_m = meta.get("embedding_model", "")
        emb_dim = 384 if "all-MiniLM" in emb_m else (768 if "mpnet" in emb_m else 1024)
    return CollectionResponse(
        id=str(col.id), name=col.name, description=meta.get("description"),
        document_count=doc_count, chunk_count=max(int(doc_chunks), int(pg_chunks)),
        chunk_size=int(meta.get("chunk_size", 1024)), chunk_overlap=int(meta.get("chunk_overlap", 50)),
        embedding_model=meta.get("embedding_model", "BAAI/bge-m3"), embedding_dimension=emb_dim,
        llama_cloud_api_key="", created_at=created_at or "", updated_at=updated_at or "",
    )

class RetrievalKUpdate(BaseModel):
    retrieval_k: int

@router.get("/settings", response_model=SettingsResponse)
def get_settings(collection_id: Optional[str] = None, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    from knowledge import get_active_parser_config
    parser_cfg = get_active_parser_config(db)
    llama_key = parser_cfg.get("api_key") or get_setting(db, "llama_cloud_api_key", os.getenv("LLAMA_CLOUD_API_KEY", ""))
    chunk_size, chunk_overlap = int(get_setting(db, "chunk_size", "1024")), int(get_setting(db, "chunk_overlap", "50"))
    emb_model, retrieval_k = get_setting(db, "embedding_model", "BAAI/bge-m3"), int(get_setting(db, "retrieval_top_k", "3"))
    active_col_id = get_setting(db, "active_collection_id", "")
    active_ids = [s.strip() for s in active_col_id.split(",") if s.strip()]
    if collection_id:
        try:
            col = db.query(KnowledgeCollection).filter(KnowledgeCollection.id == uuid.UUID(collection_id)).first()
            if col:
                meta = col.cmetadata if isinstance(col.cmetadata, dict) else {}
                return SettingsResponse(
                    llama_cloud_api_key="", chunk_size=int(meta.get("chunk_size", chunk_size)),
                    chunk_overlap=int(meta.get("chunk_overlap", chunk_overlap)), embedding_model=meta.get("embedding_model", emb_model),
                    active_collection_id=active_col_id or None, active_collection_ids=active_ids, retrieval_k=int(meta.get("retrieval_k", retrieval_k)),
                )
        except Exception: pass
    return SettingsResponse(
        llama_cloud_api_key="", chunk_size=chunk_size, chunk_overlap=chunk_overlap, embedding_model=emb_model,
        active_collection_id=active_col_id or None, active_collection_ids=active_ids, retrieval_k=retrieval_k,
    )

def _sync_retrieval_k(db: Session, clamped_k: int) -> None:
    set_setting(db, "retrieval_top_k", str(clamped_k))
    try:
        for col in db.query(KnowledgeCollection).all():
            cm = dict(col.cmetadata) if isinstance(col.cmetadata, dict) else {}
            cm["retrieval_k"] = clamped_k
            col.cmetadata = cm
            flag_modified(col, "cmetadata")
        db.commit()
    except Exception: pass

@router.put("/settings", response_model=SettingsResponse)
def update_settings(data: SettingsUpdate, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    col_target = None
    if data.collection_id:
        try: col_target = db.query(KnowledgeCollection).filter(KnowledgeCollection.id == uuid.UUID(data.collection_id)).first()
        except Exception: pass
    if col_target:
        meta = dict(col_target.cmetadata) if isinstance(col_target.cmetadata, dict) else {}
        if data.llama_cloud_api_key is not None: meta["llama_cloud_api_key"] = data.llama_cloud_api_key
        if data.chunk_size is not None: meta["chunk_size"] = max(1, min(4000, data.chunk_size))
        if data.chunk_overlap is not None: meta["chunk_overlap"] = max(0, min(500, data.chunk_overlap))
        if data.embedding_model is not None: meta["embedding_model"] = data.embedding_model
        if data.retrieval_k is not None: meta["retrieval_k"] = max(1, min(50, data.retrieval_k))
        meta["updated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        col_target.cmetadata = meta
        flag_modified(col_target, "cmetadata")
        db.commit()
    else:
        if data.llama_cloud_api_key is not None:
            set_setting(db, "llama_cloud_api_key", data.llama_cloud_api_key)
            try:
                p = db.query(ModelProvider).filter(ModelProvider.category == "parser").first()
                if p: p.api_key = data.llama_cloud_api_key
                else: db.add(ModelProvider(category="parser", provider_type="llamaindex", name="LlamaIndex", base_url="https://api.cloud.llamaindex.ai", api_key=data.llama_cloud_api_key, model_name="llama-parse", is_active=True, is_default=True))
                db.commit()
            except Exception: pass
        if data.chunk_size is not None: set_setting(db, "chunk_size", str(max(1, min(4000, data.chunk_size))))
        if data.chunk_overlap is not None: set_setting(db, "chunk_overlap", str(max(0, min(500, data.chunk_overlap))))
        if data.embedding_model is not None: set_setting(db, "embedding_model", data.embedding_model)
    if data.retrieval_k is not None: _sync_retrieval_k(db, max(1, min(50, data.retrieval_k)))
    if data.active_collection_ids is not None:
        set_setting(db, "active_collection_id", ",".join([s.strip() for s in data.active_collection_ids if s.strip()]))
    elif data.active_collection_id is not None:
        set_setting(db, "active_collection_id", data.active_collection_id)
    return get_settings(collection_id=data.collection_id, current_user=current_user, db=db)

@router.post("/settings/public-update-k")
def update_retrieval_k(data: RetrievalKUpdate, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    clamped_k = max(1, min(50, data.retrieval_k))
    _sync_retrieval_k(db, clamped_k)
    return {"status": "ok", "retrieval_k": clamped_k}

@router.get("/collections", response_model=List[CollectionResponse])
def list_collections(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    return [make_col_response(c, db) for c in db.query(KnowledgeCollection).order_by(KnowledgeCollection.name.asc()).all()]

@router.post("/collections", response_model=CollectionResponse, status_code=201)
def create_collection(data: CollectionCreate, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    col_name = data.name.strip()
    if not col_name: raise HTTPException(status_code=400, detail="Collection name cannot be empty.")
    if db.query(KnowledgeCollection).filter(func.lower(KnowledgeCollection.name) == func.lower(col_name)).first():
        raise HTTPException(status_code=400, detail=f"Collection '{col_name}' already exists.")
    emb_model = data.embedding_model
    if not emb_model:
        try:
            from knowledge import get_active_embedding_config
            emb_model = get_active_embedding_config(db).get("model_name")
        except Exception: emb_model = ""
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    col = KnowledgeCollection(id=uuid.uuid4(), name=col_name, cmetadata={"description": data.description, "embedding_model": emb_model or "", "parser_model": data.parser_model or "LlamaCloud", "created_at": now, "updated_at": now})
    db.add(col)
    db.commit()
    db.refresh(col)
    if not get_setting(db, "active_collection_id", ""): set_setting(db, "active_collection_id", str(col.id))
    return make_col_response(col, db)

@router.put("/collections/{collection_id}", response_model=CollectionResponse)
def update_collection(collection_id: uuid.UUID, data: CollectionUpdate, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    col = db.query(KnowledgeCollection).filter(KnowledgeCollection.id == collection_id).first()
    if not col: raise HTTPException(status_code=404, detail="Collection not found")
    meta = col.cmetadata if isinstance(col.cmetadata, dict) else {}
    if data.name:
        new_name = data.name.strip()
        existing = db.query(KnowledgeCollection).filter(func.lower(KnowledgeCollection.name) == func.lower(new_name), KnowledgeCollection.id != collection_id).first()
        if existing: raise HTTPException(status_code=400, detail=f"Collection '{new_name}' already exists.")
        col.name = new_name
    if data.description is not None: meta["description"] = data.description
    meta["updated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    col.cmetadata = meta
    db.commit()
    db.refresh(col)
    return make_col_response(col, db)

@router.post("/collections/{collection_id}/retrieval")
def test_retrieval(collection_id: uuid.UUID, data: RetrievalRequest, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    col = db.query(KnowledgeCollection).filter(KnowledgeCollection.id == collection_id).first()
    if not col: raise HTTPException(status_code=404, detail="Collection not found")
    try:
        from langchain_postgres.vectorstores import PGVector
        from config import DATABASE_URL
        from knowledge import get_embeddings
        vector_store = PGVector(embeddings=get_embeddings(db), collection_name=col.name, connection=DATABASE_URL, use_jsonb=True)
        results = vector_store.similarity_search_with_score(data.query, k=data.top_k)
        items = [{"page_content": doc.page_content, "metadata": doc.metadata, "score": round(float(score), 4)} for doc, score in results]
        return {"items": items, "query": data.query, "collection_name": col.name}
    except Exception as err:
        err_msg = str(err)
        if "different vector dimensions" in err_msg:
            match = re.search(r"different vector dimensions (\d+) and (\d+)", err_msg)
            stored_dim, current_dim = match.groups() if match else ("", "")
            err_msg = (f"Vector dimension mismatch: This collection is stored using {stored_dim}-dimension embeddings, but the active model produces {current_dim}-dimension embeddings. Please re-upload/re-ingest your documents or switch back to a matching embedding model.") if match else "Vector dimension mismatch: This collection was stored using a different embedding model. Please re-upload/re-ingest your documents or switch back to the matching embedding model."
        return {"items": [], "query": data.query, "error": err_msg}

@router.delete("/collections/{collection_id}", status_code=204)
def delete_collection(collection_id: uuid.UUID, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    col = db.query(KnowledgeCollection).filter(KnowledgeCollection.id == collection_id).first()
    if not col: raise HTTPException(status_code=404, detail="Collection not found")
    db.delete(col)
    db.commit()
    return None
