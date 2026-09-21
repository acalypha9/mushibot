from fastapi import APIRouter

from routes.knowledge_chunks import (
    ChunkItem,
    DocumentChunksResponse,
    delete_document_chunk,
    get_document_chunks,
    router as chunks_router,
)
from routes.knowledge_collections import (
    RetrievalKUpdate,
    create_collection,
    delete_collection,
    get_setting,
    get_settings,
    list_collections,
    make_col_response,
    router as collections_router,
    set_setting,
    test_retrieval,
    touch_collection,
    update_collection,
    update_retrieval_k,
    update_settings,
)
from routes.knowledge_documents import (
    cancel_document_ingestion,
    create_manual_document,
    delete_document,
    download_document,
    ingest_document,
    list_documents,
    make_doc_response,
    router as documents_router,
    upload_document,
)

router = APIRouter(prefix="/api/knowledge", tags=["knowledge"])

router.include_router(collections_router)
router.include_router(documents_router)
router.include_router(chunks_router)

__all__ = [
    "router",
    "collections_router",
    "documents_router",
    "chunks_router",
    "get_setting",
    "set_setting",
    "touch_collection",
    "make_col_response",
    "make_doc_response",
    "RetrievalKUpdate",
    "ChunkItem",
    "DocumentChunksResponse",
    "get_settings",
    "update_settings",
    "update_retrieval_k",
    "list_collections",
    "create_collection",
    "update_collection",
    "test_retrieval",
    "delete_collection",
    "list_documents",
    "create_manual_document",
    "upload_document",
    "ingest_document",
    "cancel_document_ingestion",
    "download_document",
    "delete_document",
    "get_document_chunks",
    "delete_document_chunk",
]
