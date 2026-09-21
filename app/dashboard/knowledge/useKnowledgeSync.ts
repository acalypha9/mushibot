import { useEffect, useMemo } from "react";
import { Collection, ChunkItem, DeleteTarget, KBSettings } from "./types";
import { KnowledgeDataState, KnowledgeFormAction } from "./knowledgeReducers";

interface UseKnowledgeSyncParams {
  embeddingProviders: KnowledgeDataState["embeddingProviders"];
  settings: KBSettings;
  activeTab: "overview" | "documents" | "retrieval" | "settings";
  chunkSizeInput: number | string;
  chunkOverlapInput: number | string;
  embeddingModelInput: string;
  llamaKeyInput: string;
  retrievalKInput: number | string;
  errorMsg: string | null;
  successMsg: string | null;
  dispatchForm: React.Dispatch<KnowledgeFormAction>;
  setErrorMsg: (msg: string | null) => void;
  setSuccessMsg: (msg: string | null) => void;
  setHasUnsavedChanges: (val: boolean) => void;
  setIsSaved: (val: boolean) => void;
  setShowCreateColModal: (val: boolean) => void;
  setEditingCol: (val: Collection | null) => void;
  setShowUploadModal: (val: boolean) => void;
  setViewingChunkModal: (val: ChunkItem | null) => void;
  setDeleteTarget: (val: DeleteTarget | null) => void;
}

export function useKnowledgeSync({
  embeddingProviders,
  settings,
  activeTab,
  chunkSizeInput,
  chunkOverlapInput,
  embeddingModelInput,
  llamaKeyInput,
  retrievalKInput,
  errorMsg,
  successMsg,
  dispatchForm,
  setErrorMsg,
  setSuccessMsg,
  setHasUnsavedChanges,
  setIsSaved,
  setShowCreateColModal,
  setEditingCol,
  setShowUploadModal,
  setViewingChunkModal,
  setDeleteTarget,
}: UseKnowledgeSyncParams) {
  const availableEmbeddingModels: string[] = useMemo(() => {
    return Array.from(
      new Set(
        embeddingProviders
          .flatMap((provider) => {
            const config = provider.config || {};
            const configuredModels = config.configured_models || [];
            const activeFromConfig = configuredModels
              .filter((m) => m && m.is_active !== false)
              .map((m) => m.name || m.id);

            if (activeFromConfig.length > 0) return activeFromConfig;
            if (provider.model_name && provider.model_name.trim()) return [provider.model_name.trim()];
            return [];
          })
          .filter(Boolean) as string[]
      )
    );
  }, [embeddingProviders]);

  const hasNoEmbeddingModel = availableEmbeddingModels.length === 0;

  useEffect(() => {
    if (errorMsg || successMsg) {
      const timer = setTimeout(() => {
        setErrorMsg(null);
        setSuccessMsg(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg, successMsg, setErrorMsg, setSuccessMsg]);

  const settingsChunkSize = settings?.chunk_size;
  const settingsChunkOverlap = settings?.chunk_overlap;
  const settingsEmbeddingModel = settings?.embedding_model;
  const settingsLlamaKey = settings?.llama_cloud_api_key;
  const settingsRetrievalK = settings?.retrieval_k;

  useEffect(() => {
    const currentSettings = settings;
    if (currentSettings) {
      let nextEmbModel = "";
      if (availableEmbeddingModels.length > 0) {
        const saved = currentSettings.embedding_model;
        if (saved && availableEmbeddingModels.includes(saved)) {
          nextEmbModel = saved;
        } else {
          nextEmbModel = availableEmbeddingModels[0];
        }
      }

      dispatchForm({
        type: "RESET_FORM",
        payload: {
          chunkSizeInput: currentSettings.chunk_size || 1024,
          chunkOverlapInput: currentSettings.chunk_overlap || 50,
          llamaKeyInput: currentSettings.llama_cloud_api_key || "",
          retrievalKInput: currentSettings.retrieval_k || 3,
          embeddingModelInput: nextEmbModel,
          hasUnsavedChanges: false,
          isSaved: false,
        },
      });
    }
  }, [
    activeTab,
    settings,
    availableEmbeddingModels,
    dispatchForm,
  ]);

  useEffect(() => {
    const initSize = settingsChunkSize ?? 1024;
    const initOverlap = settingsChunkOverlap ?? 50;
    const initEmbed = settingsEmbeddingModel || "BAAI/bge-m3";
    const initLlama = settingsLlamaKey || "";
    const initK = settingsRetrievalK ?? 3;

    const isChunkSizeChanged = Number(chunkSizeInput) !== Number(initSize);
    const isOverlapChanged = Number(chunkOverlapInput) !== Number(initOverlap);
    const isEmbeddingChanged = (embeddingModelInput || "") !== initEmbed;
    const isLlamaKeyChanged = (llamaKeyInput || "") !== initLlama;
    const isKChanged = Number(retrievalKInput) !== Number(initK);

    const dirty =
      isChunkSizeChanged || isOverlapChanged || isEmbeddingChanged || isLlamaKeyChanged || isKChanged;
    setHasUnsavedChanges(dirty);
    if (dirty) {
      setIsSaved(false);
    }
  }, [
    chunkSizeInput,
    chunkOverlapInput,
    embeddingModelInput,
    llamaKeyInput,
    retrievalKInput,
    settingsChunkSize,
    settingsChunkOverlap,
    settingsEmbeddingModel,
    settingsLlamaKey,
    settingsRetrievalK,
    setHasUnsavedChanges,
    setIsSaved,
  ]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowCreateColModal(false);
        setEditingCol(null);
        setShowUploadModal(false);
        setViewingChunkModal(null);
        setDeleteTarget(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    setShowCreateColModal,
    setEditingCol,
    setShowUploadModal,
    setViewingChunkModal,
    setDeleteTarget,
  ]);

  return { availableEmbeddingModels, hasNoEmbeddingModel };
}
