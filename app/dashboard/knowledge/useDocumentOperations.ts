import { FormEvent } from "react";
import { Collection, DocumentItem, ChunkItem, DeleteTarget, RetrievalItem, getDisplayTitle } from "./types";
import { resolveDownloadFilename } from "./knowledgeUtils";
import {
  buildDocumentDownloadRequest,
  buildDocumentChunksRequest,
  buildDeleteChunkRequest,
  buildDeleteDocumentRequest,
  buildTestRetrievalRequest,
} from "./operationsBuilders";

interface UseDocumentOperationsParams {
  token: string | null;
  selectedCol: Collection | null;
  viewingDoc: DocumentItem | null;
  retrievalQuery: string;
  retrievalTopK: number;
  setErrorMsg: (msg: string | null) => void;
  setSuccessMsg: (msg: string | null) => void;
  triggerRefresh: () => void;
  setViewingDoc: (doc: DocumentItem | null | ((prev: DocumentItem | null) => DocumentItem | null)) => void;
  setDocChunks: (updater: ChunkItem[] | ((prev: ChunkItem[]) => ChunkItem[])) => void;
  setLoadingChunks: (loading: boolean) => void;
  setChunkPage: (page: number) => void;
  setDeleteTarget: (target: DeleteTarget | null) => void;
  setRetrievalLoading: (loading: boolean) => void;
  setRetrievalResults: (results: RetrievalItem[]) => void;
}

export function useDocumentOperations({
  token,
  selectedCol,
  viewingDoc,
  retrievalQuery,
  retrievalTopK,
  setErrorMsg,
  setSuccessMsg,
  triggerRefresh,
  setViewingDoc,
  setDocChunks,
  setLoadingChunks,
  setChunkPage,
  setDeleteTarget,
  setRetrievalLoading,
  setRetrievalResults,
}: UseDocumentOperationsParams) {
  const handleDownloadDoc = async (doc: DocumentItem) => {
    try {
      const req = buildDocumentDownloadRequest({ token, docId: doc.id });
      const res = await fetch(req.url, {
        headers: req.headers,
      });
      if (!res.ok) {
        let title = doc.title || "document.md";
        if (!title.includes(".")) {
          title += ".md";
        }
        const content = doc.markdown_text || doc.content_text || "";
        const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = title;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 1500);
        return;
      }

      const disposition = res.headers.get("Content-Disposition") || res.headers.get("content-disposition");
      const filename = resolveDownloadFilename(disposition, doc);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 2000);
    } catch (err) {
      console.error("Error downloading document:", err);
      setErrorMsg(err instanceof Error ? err.message : "Download failed");
    }
  };

  const handleOpenDocDetails = async (doc: DocumentItem) => {
    setViewingDoc(doc);
    setLoadingChunks(true);
    setChunkPage(1);
    try {
      const req = buildDocumentChunksRequest({ token, docId: doc.id });
      const res = await fetch(req.url, {
        headers: req.headers,
      });
      const data = await res.json();
      if (res.ok) {
        setDocChunks(data.chunks || []);
        setViewingDoc(data.document || doc);
      }
    } catch (err) {
      console.error("Failed to load chunks:", err);
    } finally {
      setLoadingChunks(false);
    }
  };

  const handleDeleteChunk = (chunk: ChunkItem) => {
    if (!viewingDoc) return;
    setDeleteTarget({
      title: "chunk",
      name: `#${chunk.index}`,
      warning: "This will remove this vector chunk from PGVector. This action cannot be undone.",
      onConfirm: async () => {
        try {
          const req = buildDeleteChunkRequest({ token, docId: viewingDoc.id, chunkId: chunk.id });
          const res = await fetch(req.url, {
            method: req.method,
            headers: req.headers,
          });
          if (res.ok) {
            setDocChunks((prev) => prev.filter((c) => c.id !== chunk.id));
            const nowIso = new Date().toISOString();
            setViewingDoc((prev) =>
              prev
                ? {
                    ...prev,
                    chunk_count: Math.max(0, prev.chunk_count - 1),
                    updated_at: nowIso,
                  }
                : null
            );
            setSuccessMsg(`Chunk #${chunk.index} deleted.`);
            triggerRefresh();
          }
        } catch (err) {
          console.error("Failed to delete chunk:", err);
        }
      },
    });
  };

  const handleDeleteDoc = (doc: DocumentItem) => {
    const docTitle = getDisplayTitle(doc);
    setDeleteTarget({
      title: "document",
      name: docTitle,
      warning: "This will delete the document and all its chunks. This action cannot be undone.",
      onConfirm: async () => {
        setErrorMsg(null);
        setSuccessMsg(null);
        try {
          const req = buildDeleteDocumentRequest({ token, docId: doc.id });
          const res = await fetch(req.url, {
            method: req.method,
            headers: req.headers,
          });
          if (!res.ok) throw new Error("Failed to delete document");
          setSuccessMsg(`Document '${docTitle}' deleted.`);
          if (viewingDoc?.id === doc.id) setViewingDoc(null);
          triggerRefresh();
        } catch (err) {
          setErrorMsg(err instanceof Error ? err.message : "Delete document failed");
        }
      },
    });
  };

  const handleTestRetrieval = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedCol || !retrievalQuery) return;
    setRetrievalLoading(true);
    try {
      const req = buildTestRetrievalRequest({
        token,
        colId: selectedCol.id,
        query: retrievalQuery,
        topK: retrievalTopK,
      });
      const res = await fetch(req.url, {
        method: req.method,
        headers: req.headers,
        body: req.body,
      });
      const data = await res.json();
      if (res.ok && !data.error) {
        setRetrievalResults(data.items || []);
      } else {
        setErrorMsg(data.error || data.detail || "Retrieval test failed. Please check your provider configuration.");
        setRetrievalResults([]);
      }
    } catch (err) {
      console.error("Retrieval test error:", err);
      setErrorMsg(err instanceof Error ? err.message : "Retrieval test failed");
    } finally {
      setRetrievalLoading(false);
    }
  };

  return {
    handleDownloadDoc,
    handleOpenDocDetails,
    handleDeleteChunk,
    handleDeleteDoc,
    handleTestRetrieval,
  };
}
