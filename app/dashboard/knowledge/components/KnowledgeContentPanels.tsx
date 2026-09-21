import React from "react";
import CollectionOverview from "./CollectionOverview";
import DocumentsTab from "./DocumentsTab";
import RetrievalTab from "./RetrievalTab";
import KnowledgeSettings from "./KnowledgeSettings";
import { Collection, KBSettings, DocumentItem, ChunkItem, RetrievalItem } from "../types";

interface KnowledgeContentPanelsProps {
  activeTab: "overview" | "documents" | "retrieval" | "settings";
  selectedCol: Collection;
  documents: DocumentItem[];
  settings: KBSettings;
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

export default function KnowledgeContentPanels({
  activeTab,
  selectedCol,
  documents,
  settings,
  hasNoEmbeddingModel,
  viewingDoc,
  docChunks,
  loadingChunks,
  chunkPage,
  chunkItemsPerPage,
  onSetViewingDoc,
  onSetChunkPage,
  onSetChunkItemsPerPage,
  onViewChunkModal,
  onDeleteChunk,
  ingestingDoc,
  ingestProgress,
  ingestStep,
  onCancelIngestion,
  onOpenUploadModal,
  docSearchInput,
  onDocSearchInputChange,
  onDocSearchSubmit,
  onClearDocSearch,
  docSortColumn,
  docSortDirection,
  onDocSort,
  currentDocsPage,
  totalFiltered,
  itemsPerPage,
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  onSetCurrentPage,
  onSetItemsPerPage,
  onOpenDocDetails,
  onDownloadDoc,
  onDeleteDoc,
  retrievalQuery,
  retrievalTopK,
  retrievalLoading,
  retrievalResults,
  showRetrievalTooltip,
  onSetRetrievalQuery,
  onSetRetrievalTopK,
  onSetShowRetrievalTooltip,
  onTestRetrieval,
  onNumberInputChange,
  hasUnsavedChanges,
  isSaved,
  chunkSizeInput,
  chunkOverlapInput,
  parseModelInput,
  availableEmbeddingModels,
  onSetChunkSizeInput,
  onSetChunkOverlapInput,
  onSetParseModelInput,
  onSaveSettings,
}: KnowledgeContentPanelsProps) {
  return (
    <>
      {activeTab === "overview" && (
        <CollectionOverview
          selectedCol={selectedCol}
          documents={documents}
          settings={settings}
        />
      )}

      {activeTab === "documents" && (
        <DocumentsTab
          viewingDoc={viewingDoc}
          docChunks={docChunks}
          loadingChunks={loadingChunks}
          chunkPage={chunkPage}
          chunkItemsPerPage={chunkItemsPerPage}
          onSetViewingDoc={onSetViewingDoc}
          onSetChunkPage={onSetChunkPage}
          onSetChunkItemsPerPage={onSetChunkItemsPerPage}
          onViewChunkModal={onViewChunkModal}
          onDeleteChunk={onDeleteChunk}
          ingestingDoc={ingestingDoc}
          ingestProgress={ingestProgress}
          ingestStep={ingestStep}
          onCancelIngestion={onCancelIngestion}
          hasNoEmbeddingModel={hasNoEmbeddingModel}
          onOpenUploadModal={onOpenUploadModal}
          docSearchInput={docSearchInput}
          onDocSearchInputChange={onDocSearchInputChange}
          onDocSearchSubmit={onDocSearchSubmit}
          onClearDocSearch={onClearDocSearch}
          docSortColumn={docSortColumn}
          docSortDirection={docSortDirection}
          onDocSort={onDocSort}
          currentDocsPage={currentDocsPage}
          totalFiltered={totalFiltered}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          totalPages={totalPages}
          startIndex={startIndex}
          endIndex={endIndex}
          onSetCurrentPage={onSetCurrentPage}
          onSetItemsPerPage={onSetItemsPerPage}
          onOpenDocDetails={onOpenDocDetails}
          onDownloadDoc={onDownloadDoc}
          onDeleteDoc={onDeleteDoc}
        />
      )}

      {activeTab === "retrieval" && (
        <RetrievalTab
          selectedCol={selectedCol}
          documents={documents}
          hasNoEmbeddingModel={hasNoEmbeddingModel}
          retrievalQuery={retrievalQuery}
          retrievalTopK={retrievalTopK}
          retrievalLoading={retrievalLoading}
          retrievalResults={retrievalResults}
          showRetrievalTooltip={showRetrievalTooltip}
          onSetRetrievalQuery={onSetRetrievalQuery}
          onSetRetrievalTopK={onSetRetrievalTopK}
          onSetShowRetrievalTooltip={onSetShowRetrievalTooltip}
          onTestRetrieval={onTestRetrieval}
          onNumberInputChange={onNumberInputChange}
        />
      )}

      {activeTab === "settings" && (
        <KnowledgeSettings
          selectedCol={selectedCol}
          settings={settings}
          hasUnsavedChanges={hasUnsavedChanges}
          isSaved={isSaved}
          chunkSizeInput={chunkSizeInput}
          chunkOverlapInput={chunkOverlapInput}
          parseModelInput={parseModelInput}
          availableEmbeddingModels={availableEmbeddingModels}
          onSetChunkSizeInput={onSetChunkSizeInput}
          onSetChunkOverlapInput={onSetChunkOverlapInput}
          onSetParseModelInput={onSetParseModelInput}
          onSaveSettings={onSaveSettings}
          onNumberInputChange={onNumberInputChange}
        />
      )}
    </>
  );
}
