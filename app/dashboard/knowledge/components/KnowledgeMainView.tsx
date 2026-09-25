import React from "react";
import CollectionsView from "./CollectionsView";
import KnowledgeHeader from "./KnowledgeHeader";
import KnowledgeTabs from "./KnowledgeTabs";
import KnowledgeContentPanels from "./KnowledgeContentPanels";
import { Collection, KBSettings, DocumentItem, ChunkItem, RetrievalItem } from "../types";
import styles from "../knowledge.module.css";

interface KnowledgeMainViewProps {
  selectedCol: Collection | null;
  collections: Collection[];
  filteredCollections: Collection[];
  settings: KBSettings;
  activeCollectionSet: Set<string>;
  colSearchInput: string;
  colSearchQuery: string;
  colViewMode: "grid" | "list";
  onSearchInputChange: (val: string) => void;
  onSearchSubmit: (val: string) => void;
  onClearSearch: () => void;
  onViewModeChange: (mode: "grid" | "list") => void;
  onOpenCreateModal: () => void;
  onSelectCollection: (col: Collection) => void;
  onSetActiveCollection: (colId: string, e?: React.MouseEvent | React.ChangeEvent) => void;
  onEditCollection: (col: Collection) => void;
  onDeleteCollection: (colId: string, targetColName: string) => void;

  activeTab: "overview" | "documents" | "retrieval" | "settings";
  documents: DocumentItem[];
  onBackToCollections: () => void;
  onTabChange: (tabId: "overview" | "documents" | "retrieval" | "settings") => void;

  hasNoEmbeddingModel: boolean;
  viewingDoc: DocumentItem | null;
  docChunks: ChunkItem[];
  loadingChunks: boolean;
  chunkPage: number;
  chunkItemsPerPage: number;
  onSetViewingDoc: (doc: DocumentItem | null | ((prev: DocumentItem | null) => DocumentItem | null)) => void;
  onSetChunkPage: (page: number | ((prev: number) => number)) => void;
  onSetChunkItemsPerPage: (val: number) => void;
  onViewChunkModal: (chunk: ChunkItem | null) => void;
  onDeleteChunk: (chunk: ChunkItem) => void;
  ingestingDoc: DocumentItem | null;
  ingestProgress: number;
  ingestStep: string;
  onCancelIngestion: () => void;
  onOpenUploadModal: () => void;
  docSearchInput: string;
  onDocSearchInputChange: (val: string) => void;
  onDocSearchSubmit: (val: string) => void;
  onClearDocSearch: () => void;
  docSortColumn: "name" | "type" | "size" | "chunks" | "created_at";
  docSortDirection: "asc" | "desc";
  onDocSort: (column: "name" | "type" | "size" | "chunks" | "created_at") => void;
  currentDocsPage: DocumentItem[];
  totalFiltered: number;
  itemsPerPage: number;
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  onSetCurrentPage: (page: number | ((prev: number) => number)) => void;
  onSetItemsPerPage: (val: number) => void;
  onOpenDocDetails: (doc: DocumentItem) => void;
  onDownloadDoc: (doc: DocumentItem) => void;
  onDeleteDoc: (doc: DocumentItem) => void;
  retrievalQuery: string;
  retrievalTopK: number;
  retrievalLoading: boolean;
  retrievalResults: RetrievalItem[];
  showRetrievalTooltip: boolean;
  onSetRetrievalQuery: (val: string) => void;
  onSetRetrievalTopK: (val: number | string) => void;
  onSetShowRetrievalTooltip: (show: boolean | ((prev: boolean) => boolean)) => void;
  onTestRetrieval: (e: React.FormEvent) => Promise<void>;
  onNumberInputChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    min: number,
    max: number,
    setter: (val: number | string) => void
  ) => void;
  hasUnsavedChanges: boolean;
  isSaved: boolean;
  chunkSizeInput: number | string;
  chunkOverlapInput: number | string;
  parseModelInput: string;
  availableEmbeddingModels: string[];
  onSetChunkSizeInput: (val: number | string) => void;
  onSetChunkOverlapInput: (val: number | string) => void;
  onSetParseModelInput: (val: string) => void;
  onSaveSettings: (e: React.FormEvent) => Promise<void>;
}

export default function KnowledgeMainView(props: KnowledgeMainViewProps) {
  if (!props.selectedCol) {
    return (
      <CollectionsView
        collections={props.collections}
        filteredCollections={props.filteredCollections}
        settings={props.settings}
        activeCollectionSet={props.activeCollectionSet}
        colSearchInput={props.colSearchInput}
        colSearchQuery={props.colSearchQuery}
        colViewMode={props.colViewMode}
        onSearchInputChange={props.onSearchInputChange}
        onSearchSubmit={props.onSearchSubmit}
        onClearSearch={props.onClearSearch}
        onViewModeChange={props.onViewModeChange}
        onOpenCreateModal={props.onOpenCreateModal}
        onSelectCollection={props.onSelectCollection}
        onSetActiveCollection={props.onSetActiveCollection}
        onEditCollection={props.onEditCollection}
        onDeleteCollection={props.onDeleteCollection}
      />
    );
  }

  return (
    <div className={styles.collectionPage}>
      <KnowledgeHeader
        selectedCol={props.selectedCol}
        onBackToCollections={props.onBackToCollections}
      />
      <KnowledgeTabs
        activeTab={props.activeTab}
        documentCount={props.documents.length}
        onTabChange={props.onTabChange}
      />
      <KnowledgeContentPanels
        activeTab={props.activeTab}
        selectedCol={props.selectedCol}
        documents={props.documents}
        settings={props.settings}
        hasNoEmbeddingModel={props.hasNoEmbeddingModel}
        viewingDoc={props.viewingDoc}
        docChunks={props.docChunks}
        loadingChunks={props.loadingChunks}
        chunkPage={props.chunkPage}
        chunkItemsPerPage={props.chunkItemsPerPage}
        onSetViewingDoc={props.onSetViewingDoc}
        onSetChunkPage={props.onSetChunkPage}
        onSetChunkItemsPerPage={props.onSetChunkItemsPerPage}
        onViewChunkModal={props.onViewChunkModal}
        onDeleteChunk={props.onDeleteChunk}
        ingestingDoc={props.ingestingDoc}
        ingestProgress={props.ingestProgress}
        ingestStep={props.ingestStep}
        onCancelIngestion={props.onCancelIngestion}
        onOpenUploadModal={props.onOpenUploadModal}
        docSearchInput={props.docSearchInput}
        onDocSearchInputChange={props.onDocSearchInputChange}
        onDocSearchSubmit={props.onDocSearchSubmit}
        onClearDocSearch={props.onClearDocSearch}
        docSortColumn={props.docSortColumn}
        docSortDirection={props.docSortDirection}
        onDocSort={props.onDocSort}
        currentDocsPage={props.currentDocsPage}
        totalFiltered={props.totalFiltered}
        itemsPerPage={props.itemsPerPage}
        currentPage={props.currentPage}
        totalPages={props.totalPages}
        startIndex={props.startIndex}
        endIndex={props.endIndex}
        onSetCurrentPage={props.onSetCurrentPage}
        onSetItemsPerPage={props.onSetItemsPerPage}
        onOpenDocDetails={props.onOpenDocDetails}
        onDownloadDoc={props.onDownloadDoc}
        onDeleteDoc={props.onDeleteDoc}
        retrievalQuery={props.retrievalQuery}
        retrievalTopK={props.retrievalTopK}
        retrievalLoading={props.retrievalLoading}
        retrievalResults={props.retrievalResults}
        showRetrievalTooltip={props.showRetrievalTooltip}
        onSetRetrievalQuery={props.onSetRetrievalQuery}
        onSetRetrievalTopK={props.onSetRetrievalTopK}
        onSetShowRetrievalTooltip={props.onSetShowRetrievalTooltip}
        onTestRetrieval={props.onTestRetrieval}
        onNumberInputChange={props.onNumberInputChange}
        hasUnsavedChanges={props.hasUnsavedChanges}
        isSaved={props.isSaved}
        chunkSizeInput={props.chunkSizeInput}
        chunkOverlapInput={props.chunkOverlapInput}
        parseModelInput={props.parseModelInput}
        availableEmbeddingModels={props.availableEmbeddingModels}
        onSetChunkSizeInput={props.onSetChunkSizeInput}
        onSetChunkOverlapInput={props.onSetChunkOverlapInput}
        onSetParseModelInput={props.onSetParseModelInput}
        onSaveSettings={props.onSaveSettings}
      />
    </div>
  );
}
