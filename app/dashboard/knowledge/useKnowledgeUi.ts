import { useReducer, useCallback } from "react";
import {
  KnowledgeUiState,
  knowledgeUiReducer,
} from "./knowledgeUiReducer";
import { Collection, DocumentItem, ChunkItem, DeleteTarget, RetrievalItem } from "./types";

export function useKnowledgeUi() {
  const [uiState, dispatchUi] = useReducer(knowledgeUiReducer, {
    showCreateColModal: false,
    editingCol: null,
    showRetrievalTooltip: false,
    showUploadTooltip: false,
    showUploadModal: false,
    selectedFile: null,
    dragActive: false,
    convertToMd: true,
    saveParserOutput: false,
    showAdvancedSettings: false,
    uploadChunkSize: 1024,
    uploadChunkOverlap: 50,
    uploadBatchSize: 32,
    uploadConcurrentLimit: 3,
    uploadMaxRetries: 3,
    docSearchInput: "",
    docSearchQuery: "",
    colSearchInput: "",
    colSearchQuery: "",
    colViewMode: "grid",
    itemsPerPage: 10,
    currentPage: 1,
    ingestingDoc: null,
    ingestProgress: 0,
    ingestStep: "",
    viewingDoc: null,
    docChunks: [],
    loadingChunks: false,
    chunkPage: 1,
    chunkItemsPerPage: 10,
    viewingChunkModal: null,
    copiedChunkId: null,
    docSortColumn: "created_at",
    docSortDirection: "desc",
    deleteTarget: null,
    deleting: false,
    retrievalQuery: "",
    retrievalTopK: 3,
    retrievalLoading: false,
    retrievalResults: [],
  });

  const setUiField = useCallback(
    <K extends keyof KnowledgeUiState>(
      field: K,
      payload:
        | KnowledgeUiState[K]
        | ((prev: KnowledgeUiState[K]) => KnowledgeUiState[K])
    ) => {
      dispatchUi({
        type: "SET_FIELD",
        field,
        payload: payload as KnowledgeUiState[keyof KnowledgeUiState],
      });
    },
    []
  );

  const setShowCreateColModal = useCallback((val: boolean) => setUiField("showCreateColModal", val), [setUiField]);
  const setEditingCol = useCallback((val: Collection | null) => setUiField("editingCol", val), [setUiField]);
  const setShowRetrievalTooltip = useCallback((val: boolean | ((prev: boolean) => boolean)) => setUiField("showRetrievalTooltip", val), [setUiField]);
  const setShowUploadTooltip = useCallback((val: boolean | ((prev: boolean) => boolean)) => setUiField("showUploadTooltip", val), [setUiField]);
  const setShowUploadModal = useCallback((val: boolean) => setUiField("showUploadModal", val), [setUiField]);
  const setSelectedFile = useCallback((val: File | null) => setUiField("selectedFile", val), [setUiField]);
  const setDragActive = useCallback((val: boolean) => setUiField("dragActive", val), [setUiField]);
  const setConvertToMd = useCallback((val: boolean) => setUiField("convertToMd", val), [setUiField]);
  const setSaveParserOutput = useCallback((val: boolean) => setUiField("saveParserOutput", val), [setUiField]);
  const setShowAdvancedSettings = useCallback((val: boolean | ((prev: boolean) => boolean)) => setUiField("showAdvancedSettings", val), [setUiField]);
  const setUploadChunkSize = useCallback((val: number) => setUiField("uploadChunkSize", val), [setUiField]);
  const setUploadChunkOverlap = useCallback((val: number) => setUiField("uploadChunkOverlap", val), [setUiField]);
  const setUploadBatchSize = useCallback((val: number) => setUiField("uploadBatchSize", val), [setUiField]);
  const setUploadConcurrentLimit = useCallback((val: number) => setUiField("uploadConcurrentLimit", val), [setUiField]);
  const setUploadMaxRetries = useCallback((val: number) => setUiField("uploadMaxRetries", val), [setUiField]);
  const setDocSearchInput = useCallback((val: string) => setUiField("docSearchInput", val), [setUiField]);
  const setDocSearchQuery = useCallback((val: string) => setUiField("docSearchQuery", val), [setUiField]);
  const setColSearchInput = useCallback((val: string) => setUiField("colSearchInput", val), [setUiField]);
  const setColSearchQuery = useCallback((val: string) => setUiField("colSearchQuery", val), [setUiField]);
  const setColViewMode = useCallback((val: "grid" | "list") => setUiField("colViewMode", val), [setUiField]);
  const setItemsPerPage = useCallback((val: number) => setUiField("itemsPerPage", val), [setUiField]);
  const setCurrentPage = useCallback((val: number | ((prev: number) => number)) => setUiField("currentPage", val), [setUiField]);
  const setIngestingDoc = useCallback((val: DocumentItem | null) => setUiField("ingestingDoc", val), [setUiField]);
  const setIngestProgress = useCallback((val: number | ((prev: number) => number)) => setUiField("ingestProgress", val), [setUiField]);
  const setIngestStep = useCallback((val: string) => setUiField("ingestStep", val), [setUiField]);
  const setViewingDoc = useCallback((val: DocumentItem | null | ((prev: DocumentItem | null) => DocumentItem | null)) => setUiField("viewingDoc", val), [setUiField]);
  const setDocChunks = useCallback((val: ChunkItem[] | ((prev: ChunkItem[]) => ChunkItem[])) => setUiField("docChunks", val), [setUiField]);
  const setLoadingChunks = useCallback((val: boolean) => setUiField("loadingChunks", val), [setUiField]);
  const setChunkPage = useCallback((val: number | ((prev: number) => number)) => setUiField("chunkPage", val), [setUiField]);
  const setChunkItemsPerPage = useCallback((val: number) => setUiField("chunkItemsPerPage", val), [setUiField]);
  const setViewingChunkModal = useCallback((val: ChunkItem | null) => setUiField("viewingChunkModal", val), [setUiField]);
  const setCopiedChunkId = useCallback((val: string | null) => setUiField("copiedChunkId", val), [setUiField]);
  const setDeleteTarget = useCallback((val: DeleteTarget | null) => setUiField("deleteTarget", val), [setUiField]);
  const setDeleting = useCallback((val: boolean) => setUiField("deleting", val), [setUiField]);
  const setRetrievalQuery = useCallback((val: string) => setUiField("retrievalQuery", val), [setUiField]);
  const setRetrievalTopK = useCallback((val: number | string) =>
    setUiField("retrievalTopK", typeof val === "string" ? (val === "" ? 3 : Number(val) || 3) : val), [setUiField]);
  const setRetrievalLoading = useCallback((val: boolean) => setUiField("retrievalLoading", val), [setUiField]);
  const setRetrievalResults = useCallback((val: RetrievalItem[]) => setUiField("retrievalResults", val), [setUiField]);
  const handleDocSort = useCallback((column: "name" | "type" | "size" | "chunks" | "created_at") =>
    dispatchUi({ type: "TOGGLE_DOC_SORT", column }), []);

  return {
    uiState,
    dispatchUi,
    setUiField,
    setShowCreateColModal,
    setEditingCol,
    setShowRetrievalTooltip,
    setShowUploadTooltip,
    setShowUploadModal,
    setSelectedFile,
    setDragActive,
    setConvertToMd,
    setSaveParserOutput,
    setShowAdvancedSettings,
    setUploadChunkSize,
    setUploadChunkOverlap,
    setUploadBatchSize,
    setUploadConcurrentLimit,
    setUploadMaxRetries,
    setDocSearchInput,
    setDocSearchQuery,
    setColSearchInput,
    setColSearchQuery,
    setColViewMode,
    setItemsPerPage,
    setCurrentPage,
    setIngestingDoc,
    setIngestProgress,
    setIngestStep,
    setViewingDoc,
    setDocChunks,
    setLoadingChunks,
    setChunkPage,
    setChunkItemsPerPage,
    setViewingChunkModal,
    setCopiedChunkId,
    setDeleteTarget,
    setDeleting,
    setRetrievalQuery,
    setRetrievalTopK,
    setRetrievalLoading,
    setRetrievalResults,
    handleDocSort,
  };
}
