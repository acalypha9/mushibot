import { FormEvent, MutableRefObject } from "react";
import { Collection, DocumentItem } from "./types";
import {
  buildUploadDocumentFormData,
  buildCancelIngestionRequest,
  buildIngestDocumentRequest,
} from "./operationsBuilders";

interface UseDocumentIngestParams {
  token: string | null;
  selectedCol: Collection | null;
  selectedFile: File | null;
  convertToMd: boolean;
  saveParserOutput: boolean;
  uploadChunkSize: number;
  uploadChunkOverlap: number;
  ingestingDoc: DocumentItem | null;
  progressIntervalRef: MutableRefObject<NodeJS.Timeout | null>;
  ingestAbortControllerRef: MutableRefObject<AbortController | null>;
  setErrorMsg: (msg: string | null) => void;
  setSuccessMsg: (msg: string | null) => void;
  triggerRefresh: () => void;
  setSelectedFile: (file: File | null) => void;
  setShowUploadModal: (show: boolean) => void;
  setIngestingDoc: (doc: DocumentItem | null) => void;
  setIngestProgress: (progress: number | ((prev: number) => number)) => void;
  setIngestStep: (step: string) => void;
  setDocuments: (updater: DocumentItem[] | ((prev: DocumentItem[]) => DocumentItem[])) => void;
  setViewingDoc: (doc: DocumentItem | null | ((prev: DocumentItem | null) => DocumentItem | null)) => void;
}

export function useDocumentIngest({
  token,
  selectedCol,
  selectedFile,
  convertToMd,
  saveParserOutput,
  uploadChunkSize,
  uploadChunkOverlap,
  ingestingDoc,
  progressIntervalRef,
  ingestAbortControllerRef,
  setErrorMsg,
  setSuccessMsg,
  triggerRefresh,
  setSelectedFile,
  setShowUploadModal,
  setIngestingDoc,
  setIngestProgress,
  setIngestStep,
  setDocuments,
  setViewingDoc,
}: UseDocumentIngestParams) {
  const handleCancelIngestion = async () => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    if (ingestAbortControllerRef.current) ingestAbortControllerRef.current.abort();

    const currentDoc = ingestingDoc;
    setIngestingDoc(null);
    setErrorMsg("Ingestion process cancelled.");

    if (currentDoc) {
      setDocuments((prev) => prev.filter((d) => d.id !== currentDoc.id));
      try {
        const req = buildCancelIngestionRequest({ token, docId: currentDoc.id });
        await fetch(req.url, {
          method: req.method,
          headers: req.headers,
        });
        triggerRefresh();
      } catch (err) {
        console.error("Error cancelling ingestion on backend:", err);
      }
    }
  };

  const handleIngest = async (doc: DocumentItem) => {
    const isAlreadyMd =
      doc.title.toLowerCase().endsWith(".md") ||
      doc.title.toLowerCase().endsWith(".markdown") ||
      doc.title.toLowerCase().endsWith(".txt") ||
      doc.convert_to_md === false;

    setIngestingDoc(doc);
    setIngestProgress(isAlreadyMd ? 45 : 15);
    setIngestStep(isAlreadyMd ? "Chunking Text..." : "Parsing Document...");
    setErrorMsg(null);
    setSuccessMsg(null);

    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    if (ingestAbortControllerRef.current) ingestAbortControllerRef.current.abort();

    const controller = new AbortController();
    ingestAbortControllerRef.current = controller;

    progressIntervalRef.current = setInterval(() => {
      setIngestProgress((prev) => {
        if (!isAlreadyMd && prev < 35) {
          setIngestStep("Parsing Document...");
          return prev + 10;
        } else if (prev < 65) {
          setIngestStep("Chunking Text...");
          return prev + 8;
        } else if (prev < 92) {
          setIngestStep("Generating Embeddings...");
          return prev + 4;
        }
        return prev;
      });
    }, 280);

    try {
      const req = buildIngestDocumentRequest({
        token,
        docId: doc.id,
        signal: controller.signal,
      });
      const res = await fetch(req.url, {
        method: req.method,
        headers: req.headers,
        signal: req.signal,
      });
      const data = await res.json();
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (!res.ok) throw new Error(data.detail || "Ingestion pipeline failed");

      setIngestProgress(100);
      setIngestStep("Storing Vectors & Completed!");
      setSuccessMsg(`Ingestion complete! Document split into ${data.chunk_count} vector chunks.`);

      setDocuments((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, chunk_count: data.chunk_count } : d))
      );
      triggerRefresh();

      setTimeout(() => {
        setIngestingDoc(null);
        setViewingDoc(null);
      }, 900);
    } catch (err) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (err instanceof Error && err.name === "AbortError") {
        setIngestingDoc(null);
        setErrorMsg("Ingestion process cancelled.");
        return;
      }
      setIngestingDoc(null);
      setErrorMsg(err instanceof Error ? err.message : "Ingestion failed");
      triggerRefresh();
    }
  };

  const handleUploadModalSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedCol || !selectedFile) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const req = buildUploadDocumentFormData({
        token,
        collectionId: selectedCol.id,
        file: selectedFile,
        convertToMd,
        saveParserOutput,
        uploadChunkSize,
        uploadChunkOverlap,
      });
      const res = await fetch(req.url, {
        method: req.method,
        headers: req.headers,
        body: req.formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to upload document");
      setSuccessMsg(`Document '${data.title}' uploaded! Starting ingestion pipeline...`);
      setSelectedFile(null);
      setShowUploadModal(false);
      triggerRefresh();

      handleIngest(data);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Upload failed");
    }
  };

  return { handleCancelIngestion, handleIngest, handleUploadModalSubmit };
}
