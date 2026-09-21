import datetime, uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session
from auth import require_admin
from database import get_db
from models import KnowledgeDocument, User
from routes.knowledge_collections import get_setting, touch_collection
from routes.knowledge_documents import make_doc_response
from schemas import DocumentResponse

router = APIRouter()

class ChunkItem(BaseModel):
    id: str
    index: int
    content: str
    char_count: int

class DocumentChunksResponse(BaseModel):
    document: DocumentResponse
    chunks: List[ChunkItem]

@router.get("/documents/{document_id}/chunks", response_model=DocumentChunksResponse)
def get_document_chunks(
    document_id: uuid.UUID,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    doc = db.query(KnowledgeDocument).filter(KnowledgeDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    rows = []
    try:
        rows = db.execute(
            text("""
                SELECT id, document, cmetadata->>'chunk_index' as chunk_idx
                FROM langchain_pg_embedding 
                WHERE cmetadata->>'document_id' = :doc_id 
                   OR cmetadata->>'source' = :title
                ORDER BY 
                    CASE 
                        WHEN (cmetadata->>'chunk_index') IS NOT NULL AND (cmetadata->>'chunk_index') ~ '^[0-9]+$' 
                        THEN (cmetadata->>'chunk_index')::integer 
                        ELSE 999999 
                    END ASC,
                    id ASC
            """),
            {"doc_id": str(doc.id), "title": doc.title},
        ).fetchall()
    except Exception:
        db.rollback()
        rows = []

    chunks = []
    if rows:
        for idx, r in enumerate(rows, 1):
            content_text = r[1] or ""
            chunk_idx_val = r[2]
            display_idx = (int(chunk_idx_val) + 1) if (chunk_idx_val is not None and str(chunk_idx_val).isdigit()) else idx
            chunks.append(ChunkItem(id=str(r[0]), index=display_idx, content=content_text, char_count=len(content_text)))
    else:
        raw_text = doc.markdown_text or doc.content_text or ""
        if raw_text:
            chunk_size = int(get_setting(db, "chunk_size", "512"))
            chunk_overlap = int(get_setting(db, "chunk_overlap", "50"))
            from langchain_text_splitters import Language, RecursiveCharacterTextSplitter
            splitter = RecursiveCharacterTextSplitter.from_language(
                language=Language.MARKDOWN,
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
                length_function=len,
            )
            for idx, ctext in enumerate(splitter.split_text(raw_text), 1):
                chunks.append(ChunkItem(id=f"chunk-{idx}", index=idx, content=ctext, char_count=len(ctext)))

    doc_resp = make_doc_response(doc)
    doc_resp.chunk_count = len(chunks)
    return DocumentChunksResponse(document=doc_resp, chunks=chunks)

@router.delete("/documents/{document_id}/chunks/{chunk_id}", status_code=204)
def delete_document_chunk(
    document_id: uuid.UUID,
    chunk_id: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    try:
        chunk_uuid = uuid.UUID(chunk_id)
        db.execute(text("DELETE FROM langchain_pg_embedding WHERE id = :chunk_id"), {"chunk_id": str(chunk_uuid)})
        db.commit()
        doc = db.query(KnowledgeDocument).filter(KnowledgeDocument.id == document_id).first()
        if doc:
            doc.updated_at = datetime.datetime.now(datetime.timezone.utc)
            db.commit()
            touch_collection(db, doc.collection_id)
    except Exception:
        db.rollback()
    return None
