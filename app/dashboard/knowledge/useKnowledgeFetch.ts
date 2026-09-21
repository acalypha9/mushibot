import { useEffect } from "react";
import { Collection, DocumentItem, KBSettings } from "./types";
import { KnowledgeDataAction } from "./knowledgeReducers";
import { updateSelectedColWithEqualityGuard } from "./knowledgeUtils";

interface UseKnowledgeFetchParams {
  token: string | null;
  refreshTrigger: number;
  selectedCol: Collection | null;
  dispatchData: React.Dispatch<KnowledgeDataAction>;
  setSelectedCol: (updater: Collection | null | ((prev: Collection | null) => Collection | null)) => void;
  setDocuments: (docs: DocumentItem[]) => void;
  setSettings: (settings: KBSettings | ((prev: KBSettings) => KBSettings)) => void;
  setErrorMsg: (msg: string | null) => void;
  setLlamaKeyInput: (val: string) => void;
  setChunkSizeInput: (val: number | string) => void;
  setChunkOverlapInput: (val: number | string) => void;
  setUploadChunkSize: (val: number) => void;
  setUploadChunkOverlap: (val: number) => void;
  setEmbeddingModelInput: (val: string) => void;
}

export function useKnowledgeFetch({
  token,
  refreshTrigger,
  selectedCol,
  dispatchData,
  setSelectedCol,
  setDocuments,
  setSettings,
  setErrorMsg,
  setLlamaKeyInput,
  setChunkSizeInput,
  setChunkOverlapInput,
  setUploadChunkSize,
  setUploadChunkOverlap,
  setEmbeddingModelInput,
}: UseKnowledgeFetchParams) {
  useEffect(() => {
    let active = true;
    async function fetchData() {
      if (!token) return;
      try {
        dispatchData({ type: "SET_LOADING", payload: true });
        const sRes = await fetch("/api/knowledge/settings", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const sData = await sRes.json();
        if (sRes.ok && active) {
          dispatchData({ type: "SET_SETTINGS", payload: sData });
          setLlamaKeyInput(sData.llama_cloud_api_key || "");
          const cSize = sData.chunk_size || 1024;
          const cOverlap = sData.chunk_overlap || 50;
          setChunkSizeInput(cSize);
          setChunkOverlapInput(cOverlap);
          setUploadChunkSize(cSize);
          setUploadChunkOverlap(cOverlap);
          setEmbeddingModelInput(sData.embedding_model || "BAAI/bge-m3");
        }

        const cRes = await fetch("/api/knowledge/collections", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const cData = await cRes.json();
        if (cRes.ok && active) {
          const cols: Collection[] = cData || [];
          dispatchData({ type: "SET_COLLECTIONS", payload: cols });
          setSelectedCol((prev) => updateSelectedColWithEqualityGuard(prev, cols));
        }

        const pRes = await fetch("/api/providers?category=embedding", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (pRes.ok && active) {
          const pData = await pRes.json();
          dispatchData({ type: "SET_EMBEDDING_PROVIDERS", payload: pData || [] });
        }
      } catch (err) {
        if (active) setErrorMsg(err instanceof Error ? err.message : "Failed to load knowledge data");
      } finally {
        if (active) dispatchData({ type: "SET_LOADING", payload: false });
      }
    }
    fetchData();
    return () => {
      active = false;
    };
  }, [
    token,
    refreshTrigger,
    dispatchData,
    setSelectedCol,
    setErrorMsg,
    setLlamaKeyInput,
    setChunkSizeInput,
    setChunkOverlapInput,
    setUploadChunkSize,
    setUploadChunkOverlap,
    setEmbeddingModelInput,
  ]);

  const selectedColId = selectedCol?.id;
  useEffect(() => {
    let active = true;
    async function fetchDocsAndSettings() {
      if (!token || !selectedColId) return;
      try {
        const [dRes, sRes] = await Promise.all([
          fetch(`/api/knowledge/documents?collection_id=${selectedColId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`/api/knowledge/settings?collection_id=${selectedColId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        const dData = await dRes.json();
        const sData = await sRes.json();
        if (dRes.ok && active) {
          setDocuments(dData || []);
        }
        if (sRes.ok && active && sData) {
          setSettings(sData);
          setLlamaKeyInput(sData.llama_cloud_api_key || "");
          const cSize = sData.chunk_size || 1024;
          const cOverlap = sData.chunk_overlap || 50;
          setChunkSizeInput(cSize);
          setChunkOverlapInput(cOverlap);
          setUploadChunkSize(cSize);
          setUploadChunkOverlap(cOverlap);
          setEmbeddingModelInput(sData.embedding_model || "BAAI/bge-m3");
        }
      } catch (err) {
        if (active) console.error("Error loading docs & settings:", err);
      }
    }
    fetchDocsAndSettings();
    return () => {
      active = false;
    };
  }, [
    token,
    selectedColId,
    refreshTrigger,
    setDocuments,
    setSettings,
    setLlamaKeyInput,
    setChunkSizeInput,
    setChunkOverlapInput,
    setUploadChunkSize,
    setUploadChunkOverlap,
    setEmbeddingModelInput,
  ]);
}
