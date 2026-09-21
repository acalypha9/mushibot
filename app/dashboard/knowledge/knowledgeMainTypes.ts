import React from "react";
import { Collection, KBSettings, DocumentItem, ChunkItem, RetrievalItem } from "./types";

export interface KnowledgeMainViewProps {
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
