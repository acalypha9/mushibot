import { useReducer, useCallback } from "react";
import { Collection, DocumentItem, KBSettings } from "./types";
import {
  knowledgeDataReducer,
  KnowledgeFormState,
  knowledgeFormReducer,
} from "./knowledgeReducers";
import { useKnowledgeUi } from "./useKnowledgeUi";

export function useKnowledgeState() {
  const [dataState, dispatchData] = useReducer(knowledgeDataReducer, {
    collections: [],
    selectedCol: null,
    activeTab: "overview",
    documents: [],
    settings: {
      llama_cloud_api_key: "",
      chunk_size: 512,
      chunk_overlap: 50,
      embedding_model: "BAAI/bge-m3",
    },
    loading: true,
    errorMsg: null,
    successMsg: null,
    refreshTrigger: 0,
    embeddingProviders: [],
  });

  const [formState, dispatchForm] = useReducer(knowledgeFormReducer, {
    colName: "",
    colDesc: "",
    colEmbeddingModel: "",
    colParserModel: "LlamaCloud",
    colErrorMsg: null,
    llamaKeyInput: "",
    chunkSizeInput: 1024,
    chunkOverlapInput: 50,
    retrievalKInput: 3,
    embeddingModelInput: "bge-m3",
    parseModelInput: "LlamaCloud",
    hasUnsavedChanges: false,
    isSaved: false,
  });

  const ui = useKnowledgeUi();

  const setSelectedCol = useCallback(
    (payload: Collection | null | ((prev: Collection | null) => Collection | null)) => {
      dispatchData({ type: "SET_SELECTED_COL", payload });
    },
    []
  );

  const setActiveTab = useCallback(
    (payload: "overview" | "documents" | "retrieval" | "settings") => {
      dispatchData({ type: "SET_ACTIVE_TAB", payload });
    },
    []
  );

  const setDocuments = useCallback(
    (payload: DocumentItem[] | ((prev: DocumentItem[]) => DocumentItem[])) => {
      dispatchData({ type: "SET_DOCUMENTS", payload });
    },
    []
  );

  const setSettings = useCallback(
    (payload: KBSettings | ((prev: KBSettings) => KBSettings)) => {
      dispatchData({ type: "SET_SETTINGS", payload });
    },
    []
  );

  const setErrorMsg = useCallback((payload: string | null) => {
    dispatchData({ type: "SET_ERROR_MSG", payload });
  }, []);

  const setSuccessMsg = useCallback((payload: string | null) => {
    dispatchData({ type: "SET_SUCCESS_MSG", payload });
  }, []);

  const triggerRefresh = useCallback(() => {
    dispatchData({ type: "TRIGGER_REFRESH" });
  }, []);

  const setFormField = useCallback(
    <K extends keyof KnowledgeFormState>(
      field: K,
      payload: KnowledgeFormState[K]
    ) => dispatchForm({ type: "SET_FIELD", field, payload }),
    []
  );

  const setColName = useCallback((val: string) => setFormField("colName", val), [setFormField]);
  const setColDesc = useCallback((val: string) => setFormField("colDesc", val), [setFormField]);
  const setColEmbeddingModel = useCallback((val: string) => setFormField("colEmbeddingModel", val), [setFormField]);
  const setColParserModel = useCallback((val: string) => setFormField("colParserModel", val), [setFormField]);
  const setColErrorMsg = useCallback((val: string | null) => setFormField("colErrorMsg", val), [setFormField]);
  const setLlamaKeyInput = useCallback((val: string) => setFormField("llamaKeyInput", val), [setFormField]);
  const setChunkSizeInput = useCallback((val: number | string) => setFormField("chunkSizeInput", val), [setFormField]);
  const setChunkOverlapInput = useCallback((val: number | string) => setFormField("chunkOverlapInput", val), [setFormField]);
  const setRetrievalKInput = useCallback((val: number | string) => setFormField("retrievalKInput", val), [setFormField]);
  const setEmbeddingModelInput = useCallback((val: string) => setFormField("embeddingModelInput", val), [setFormField]);
  const setParseModelInput = useCallback((val: string) => setFormField("parseModelInput", val), [setFormField]);
  const setHasUnsavedChanges = useCallback((val: boolean) => setFormField("hasUnsavedChanges", val), [setFormField]);
  const setIsSaved = useCallback((val: boolean) => setFormField("isSaved", val), [setFormField]);

  return {
    dataState,
    dispatchData,
    formState,
    dispatchForm,
    setSelectedCol,
    setActiveTab,
    setDocuments,
    setSettings,
    setErrorMsg,
    setSuccessMsg,
    triggerRefresh,
    setColName,
    setColDesc,
    setColEmbeddingModel,
    setColParserModel,
    setColErrorMsg,
    setLlamaKeyInput,
    setChunkSizeInput,
    setChunkOverlapInput,
    setRetrievalKInput,
    setEmbeddingModelInput,
    setParseModelInput,
    setHasUnsavedChanges,
    setIsSaved,
    ...ui,
  };
}
