import React from "react";
import { Collection, KBSettings, DocumentItem, ChunkItem } from "./types";
import { useCollectionMutations } from "./useCollectionMutations";
import { useCollectionSettings } from "./useCollectionSettings";
import { useDocumentIngest } from "./useDocumentIngest";
import { useDocumentOperations } from "./useDocumentOperations";
import { useDerivedKnowledgeData } from "./useDerivedKnowledgeData";
import { KnowledgeFormState } from "./knowledgeReducers";
import { KnowledgeUiState } from "./knowledgeUiReducer";
import { cleanNumberInput } from "./knowledgeUtils";
import { KnowledgeMainViewProps } from "./knowledgeMainTypes";

interface BuildKnowledgeMainViewPropsParams {
  selectedCol: Collection | null;
  collections: Collection[];
  filteredCollections: Collection[];
  settings: KBSettings;
  activeCollectionSet: Set<string>;
  uiState: KnowledgeUiState;
  activeTab: "overview" | "documents" | "retrieval" | "settings";
  documents: DocumentItem[];
  hasNoEmbeddingModel: boolean;
  availableEmbeddingModels: string[];
  formState: KnowledgeFormState;
  setSelectedCol: (col: Collection | null) => void;
  setActiveTab: (tab: "overview" | "documents" | "retrieval" | "settings") => void;
  setViewingDoc: (doc: DocumentItem | null | ((prev: DocumentItem | null) => DocumentItem | null)) => void;
  setErrorMsg: (msg: string | null) => void;
  setSuccessMsg: (msg: string | null) => void;
  setColName: (name: string) => void;
  setColDesc: (desc: string) => void;
  setColErrorMsg: (msg: string | null) => void;
  setShowCreateColModal: (show: boolean) => void;
  setDocSearchInput: (val: string) => void;
  setDocSearchQuery: (val: string) => void;
  setCurrentPage: (page: number | ((prev: number) => number)) => void;
  setEditingCol: (col: Collection | null) => void;
  setColSearchInput: (val: string) => void;
  setColSearchQuery: (val: string) => void;
  setColViewMode: (mode: "grid" | "list") => void;
  setChunkPage: (page: number | ((prev: number) => number)) => void;
  setChunkItemsPerPage: (val: number) => void;
  setViewingChunkModal: (chunk: ChunkItem | null) => void;
  setShowUploadModal: (show: boolean) => void;
  setItemsPerPage: (val: number) => void;
  setRetrievalQuery: (val: string) => void;
  setRetrievalTopK: (val: number | string) => void;
  setShowRetrievalTooltip: (show: boolean | ((prev: boolean) => boolean)) => void;
  setChunkSizeInput: (val: number | string) => void;
  setChunkOverlapInput: (val: number | string) => void;
  setParseModelInput: (val: string) => void;
  handleDocSort: (column: "name" | "type" | "size" | "chunks" | "created_at") => void;
  mutations: ReturnType<typeof useCollectionMutations>;
  colSettings: ReturnType<typeof useCollectionSettings>;
  ingest: ReturnType<typeof useDocumentIngest>;
  docOps: ReturnType<typeof useDocumentOperations>;
  derived: ReturnType<typeof useDerivedKnowledgeData>;
}

export function buildKnowledgeMainViewProps(p: BuildKnowledgeMainViewPropsParams): KnowledgeMainViewProps {
  const handleNumberInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    min: number,
    max: number,
    setter: (val: number | string) => void
  ) => {
    const cleaned = cleanNumberInput(e.target.value, min, max);
    e.target.value = String(cleaned);
    setter(cleaned);
  };

  return {
    selectedCol: p.selectedCol,
    collections: p.collections,
    filteredCollections: p.filteredCollections,
    settings: p.settings,
    activeCollectionSet: p.activeCollectionSet,
    colSearchInput: p.uiState.colSearchInput,
    colSearchQuery: p.uiState.colSearchQuery,
    colViewMode: p.uiState.colViewMode,
    onSearchInputChange: p.setColSearchInput,
    onSearchSubmit: (val: string) => p.setColSearchQuery(val),
    onClearSearch: () => {
      p.setColSearchInput("");
      p.setColSearchQuery("");
    },
    onViewModeChange: p.setColViewMode,
    onOpenCreateModal: () => {
      p.setColName("");
      p.setColDesc("");
      p.setColErrorMsg(null);
      p.setShowCreateColModal(true);
    },
    onSelectCollection: (col: Collection) => {
      p.setSelectedCol(col);
      p.setActiveTab("overview");
      p.setViewingDoc(null);
      p.setDocSearchInput("");
      p.setDocSearchQuery("");
      p.setCurrentPage(1);
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", `/dashboard/knowledge?collection=${encodeURIComponent(col.id)}`);
      }
    },
    onSetActiveCollection: p.colSettings.handleSetActiveCollection,
    onEditCollection: (col: Collection) => {
      p.setEditingCol(col);
      p.setColName(col.name);
      p.setColDesc(col.description || "");
    },
    onDeleteCollection: p.mutations.handleDeleteCollection,
    activeTab: p.activeTab,
    documents: p.documents,
    onBackToCollections: () => {
      p.setSelectedCol(null);
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", "/dashboard/knowledge");
      }
    },
    onTabChange: (tabId: "overview" | "documents" | "retrieval" | "settings") => {
      p.setActiveTab(tabId);
      p.setViewingDoc(null);
      p.setErrorMsg(null);
      p.setSuccessMsg(null);
    },
    hasNoEmbeddingModel: p.hasNoEmbeddingModel,
    viewingDoc: p.uiState.viewingDoc,
    docChunks: p.uiState.docChunks,
    loadingChunks: p.uiState.loadingChunks,
    chunkPage: p.uiState.chunkPage,
    chunkItemsPerPage: p.uiState.chunkItemsPerPage,
    onSetViewingDoc: p.setViewingDoc,
    onSetChunkPage: p.setChunkPage,
    onSetChunkItemsPerPage: p.setChunkItemsPerPage,
    onViewChunkModal: p.setViewingChunkModal,
    onDeleteChunk: p.docOps.handleDeleteChunk,
    ingestingDoc: p.uiState.ingestingDoc,
    ingestProgress: p.uiState.ingestProgress,
    ingestStep: p.uiState.ingestStep,
    onCancelIngestion: p.ingest.handleCancelIngestion,
    onOpenUploadModal: () => {
      if (!p.hasNoEmbeddingModel) p.setShowUploadModal(true);
    },
    docSearchInput: p.uiState.docSearchInput,
    onDocSearchInputChange: p.setDocSearchInput,
    onDocSearchSubmit: (val: string) => p.setDocSearchQuery(val),
    onClearDocSearch: () => {
      p.setDocSearchInput("");
      p.setDocSearchQuery("");
      p.setCurrentPage(1);
    },
    docSortColumn: p.uiState.docSortColumn,
    docSortDirection: p.uiState.docSortDirection,
    onDocSort: p.handleDocSort,
    currentDocsPage: p.derived.currentDocsPage,
    totalFiltered: p.derived.totalFiltered,
    itemsPerPage: p.uiState.itemsPerPage,
    currentPage: p.uiState.currentPage,
    totalPages: p.derived.totalPages,
    startIndex: p.derived.startIndex,
    endIndex: p.derived.endIndex,
    onSetCurrentPage: p.setCurrentPage,
    onSetItemsPerPage: p.setItemsPerPage,
    onOpenDocDetails: p.docOps.handleOpenDocDetails,
    onDownloadDoc: p.docOps.handleDownloadDoc,
    onDeleteDoc: p.docOps.handleDeleteDoc,
    retrievalQuery: p.uiState.retrievalQuery,
    retrievalTopK: p.uiState.retrievalTopK,
    retrievalLoading: p.uiState.retrievalLoading,
    retrievalResults: p.uiState.retrievalResults,
    showRetrievalTooltip: p.uiState.showRetrievalTooltip,
    onSetRetrievalQuery: p.setRetrievalQuery,
    onSetRetrievalTopK: p.setRetrievalTopK,
    onSetShowRetrievalTooltip: p.setShowRetrievalTooltip,
    onTestRetrieval: p.docOps.handleTestRetrieval,
    onNumberInputChange: handleNumberInputChange,
    hasUnsavedChanges: p.formState.hasUnsavedChanges,
    isSaved: p.formState.isSaved,
    chunkSizeInput: p.formState.chunkSizeInput,
    chunkOverlapInput: p.formState.chunkOverlapInput,
    parseModelInput: p.formState.parseModelInput,
    availableEmbeddingModels: p.availableEmbeddingModels,
    onSetChunkSizeInput: p.setChunkSizeInput,
    onSetChunkOverlapInput: p.setChunkOverlapInput,
    onSetParseModelInput: p.setParseModelInput,
    onSaveSettings: p.colSettings.handleSaveSettings,
  };
}
