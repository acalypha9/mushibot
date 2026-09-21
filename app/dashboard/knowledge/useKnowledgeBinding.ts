import { useMemo, MutableRefObject } from "react";
import { Collection } from "./types";
import { useCollectionMutations } from "./useCollectionMutations";
import { useCollectionSettings } from "./useCollectionSettings";
import { useDocumentIngest } from "./useDocumentIngest";
import { useDocumentOperations } from "./useDocumentOperations";
import { useDerivedKnowledgeData } from "./useDerivedKnowledgeData";
import { useKnowledgeSync } from "./useKnowledgeSync";
import { useKnowledgeFetch } from "./useKnowledgeFetch";
import { buildKnowledgeMainViewProps } from "./buildKnowledgeProps";
import { filterCollections } from "./knowledgeUtils";
import { KnowledgeMainViewProps } from "./knowledgeMainTypes";
import { useKnowledgeState } from "./useKnowledgeState";

export interface KnowledgeRefs {
  fileInputRef: MutableRefObject<HTMLInputElement | null>;
  progressIntervalRef: MutableRefObject<NodeJS.Timeout | null>;
  ingestAbortControllerRef: MutableRefObject<AbortController | null>;
}

export function useKnowledgeBinding(
  token: string | null,
  state: ReturnType<typeof useKnowledgeState>,
  refs: KnowledgeRefs
): {
  activeCollectionSet: Set<string>;
  filteredCollections: Collection[];
  availableEmbeddingModels: string[];
  hasNoEmbeddingModel: boolean;
  mainViewProps: KnowledgeMainViewProps;
  mutations: ReturnType<typeof useCollectionMutations>;
  ingest: ReturnType<typeof useDocumentIngest>;
} {
  const { dataState, dispatchData, formState, dispatchForm, uiState } = state;
  const { collections, selectedCol, activeTab, documents, settings, errorMsg, successMsg, refreshTrigger, embeddingProviders } = dataState;

  const { availableEmbeddingModels, hasNoEmbeddingModel } = useKnowledgeSync({
    embeddingProviders, settings, activeTab, chunkSizeInput: formState.chunkSizeInput, chunkOverlapInput: formState.chunkOverlapInput, embeddingModelInput: formState.embeddingModelInput, llamaKeyInput: formState.llamaKeyInput, retrievalKInput: formState.retrievalKInput, errorMsg, successMsg, dispatchForm, setErrorMsg: state.setErrorMsg, setSuccessMsg: state.setSuccessMsg, setHasUnsavedChanges: state.setHasUnsavedChanges, setIsSaved: state.setIsSaved, setShowCreateColModal: state.setShowCreateColModal, setEditingCol: state.setEditingCol, setShowUploadModal: state.setShowUploadModal, setViewingChunkModal: state.setViewingChunkModal, setDeleteTarget: state.setDeleteTarget,
  });

  useKnowledgeFetch({
    token, refreshTrigger, selectedCol, dispatchData, setSelectedCol: state.setSelectedCol, setDocuments: state.setDocuments, setSettings: state.setSettings, setErrorMsg: state.setErrorMsg, setLlamaKeyInput: state.setLlamaKeyInput, setChunkSizeInput: state.setChunkSizeInput, setChunkOverlapInput: state.setChunkOverlapInput, setUploadChunkSize: state.setUploadChunkSize, setUploadChunkOverlap: state.setUploadChunkOverlap, setEmbeddingModelInput: state.setEmbeddingModelInput,
  });

  const mutations = useCollectionMutations({
    token, collections, selectedCol, formState, availableEmbeddingModels, setSelectedCol: state.setSelectedCol, setErrorMsg: state.setErrorMsg, setSuccessMsg: state.setSuccessMsg, triggerRefresh: state.triggerRefresh, setColName: state.setColName, setColDesc: state.setColDesc, setColErrorMsg: state.setColErrorMsg, setShowCreateColModal: state.setShowCreateColModal, editingCol: uiState.editingCol, setEditingCol: state.setEditingCol, setDeleteTarget: state.setDeleteTarget,
  });

  const colSettings = useCollectionSettings({
    token, selectedCol, settings, formState, setSettings: state.setSettings, setErrorMsg: state.setErrorMsg, setSuccessMsg: state.setSuccessMsg, triggerRefresh: state.triggerRefresh, setUploadChunkSize: state.setUploadChunkSize, setUploadChunkOverlap: state.setUploadChunkOverlap, setHasUnsavedChanges: state.setHasUnsavedChanges, setIsSaved: state.setIsSaved,
  });

  const ingest = useDocumentIngest({
    token, selectedCol, selectedFile: uiState.selectedFile, convertToMd: uiState.convertToMd, saveParserOutput: uiState.saveParserOutput, uploadChunkSize: uiState.uploadChunkSize, uploadChunkOverlap: uiState.uploadChunkOverlap, ingestingDoc: uiState.ingestingDoc, progressIntervalRef: refs.progressIntervalRef, ingestAbortControllerRef: refs.ingestAbortControllerRef, setErrorMsg: state.setErrorMsg, setSuccessMsg: state.setSuccessMsg, triggerRefresh: state.triggerRefresh, setSelectedFile: state.setSelectedFile, setShowUploadModal: state.setShowUploadModal, setIngestingDoc: state.setIngestingDoc, setIngestProgress: state.setIngestProgress, setIngestStep: state.setIngestStep, setDocuments: state.setDocuments, setViewingDoc: state.setViewingDoc,
  });

  const docOps = useDocumentOperations({
    token, selectedCol, viewingDoc: uiState.viewingDoc, retrievalQuery: uiState.retrievalQuery, retrievalTopK: uiState.retrievalTopK, setErrorMsg: state.setErrorMsg, setSuccessMsg: state.setSuccessMsg, triggerRefresh: state.triggerRefresh, setViewingDoc: state.setViewingDoc, setDocChunks: state.setDocChunks, setLoadingChunks: state.setLoadingChunks, setChunkPage: state.setChunkPage, setDeleteTarget: state.setDeleteTarget, setRetrievalLoading: state.setRetrievalLoading, setRetrievalResults: state.setRetrievalResults,
  });

  const derived = useDerivedKnowledgeData({
    documents, docSearchQuery: uiState.docSearchQuery, docSortColumn: uiState.docSortColumn, docSortDirection: uiState.docSortDirection, itemsPerPage: uiState.itemsPerPage, currentPage: uiState.currentPage,
  });

  const activeCollectionSet = useMemo(() => new Set<string>(settings.active_collection_ids || []), [settings.active_collection_ids]);
  const filteredCollections = useMemo(() => filterCollections(collections, uiState.colSearchQuery), [collections, uiState.colSearchQuery]);

  const mainViewProps = buildKnowledgeMainViewProps({
    selectedCol, collections, filteredCollections, settings, activeCollectionSet, uiState, activeTab, documents, hasNoEmbeddingModel, availableEmbeddingModels, formState, setSelectedCol: state.setSelectedCol, setActiveTab: state.setActiveTab, setViewingDoc: state.setViewingDoc, setErrorMsg: state.setErrorMsg, setSuccessMsg: state.setSuccessMsg, setColName: state.setColName, setColDesc: state.setColDesc, setColErrorMsg: state.setColErrorMsg, setShowCreateColModal: state.setShowCreateColModal, setDocSearchInput: state.setDocSearchInput, setDocSearchQuery: state.setDocSearchQuery, setCurrentPage: state.setCurrentPage, setEditingCol: state.setEditingCol, setColSearchInput: state.setColSearchInput, setColSearchQuery: state.setColSearchQuery, setColViewMode: state.setColViewMode, setChunkPage: state.setChunkPage, setChunkItemsPerPage: state.setChunkItemsPerPage, setViewingChunkModal: state.setViewingChunkModal, setShowUploadModal: state.setShowUploadModal, setItemsPerPage: state.setItemsPerPage, setRetrievalQuery: state.setRetrievalQuery, setRetrievalTopK: state.setRetrievalTopK, setShowRetrievalTooltip: state.setShowRetrievalTooltip, setChunkSizeInput: state.setChunkSizeInput, setChunkOverlapInput: state.setChunkOverlapInput, setParseModelInput: state.setParseModelInput, handleDocSort: state.handleDocSort, mutations, colSettings, ingest, docOps, derived,
  });

  return { activeCollectionSet, filteredCollections, availableEmbeddingModels, hasNoEmbeddingModel, mainViewProps, mutations, ingest };
}
