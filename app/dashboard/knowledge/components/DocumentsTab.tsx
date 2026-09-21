"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import { DocumentItem, ChunkItem } from "../types";
import { DocSortColumn } from "./documentsLogic";
import DocumentsToolbar from "./DocumentsToolbar";
import IngestionBanner from "./IngestionBanner";
import DocumentTable from "./DocumentTable";
import DocumentPagination from "./DocumentPagination";
import DocumentDetailView from "./DocumentDetailView";

interface DocumentsTabProps {
  viewingDoc: DocumentItem | null;
  docChunks: ChunkItem[];
  loadingChunks: boolean;
  chunkPage: number;
  chunkItemsPerPage: number;
  onSetViewingDoc: (doc: DocumentItem | null) => void;
  onSetChunkPage: (page: number | ((prev: number) => number)) => void;
  onSetChunkItemsPerPage: (count: number) => void;
  onViewChunkModal: (chunk: ChunkItem) => void;
  onDeleteChunk: (chunk: ChunkItem) => void;
  // Documents Table Props
  ingestingDoc: DocumentItem | null;
  ingestProgress: number;
  ingestStep: string;
  onCancelIngestion: () => void;
  hasNoEmbeddingModel: boolean;
  onOpenUploadModal: () => void;
  docSearchInput: string;
  onDocSearchInputChange: (val: string) => void;
  onDocSearchSubmit: (val: string) => void;
  onClearDocSearch: () => void;
  docSortColumn: DocSortColumn;
  docSortDirection: "asc" | "desc";
  onDocSort: (col: DocSortColumn) => void;
  currentDocsPage: DocumentItem[];
  totalFiltered: number;
  itemsPerPage: number;
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  onSetCurrentPage: (page: number | ((prev: number) => number)) => void;
  onSetItemsPerPage: (count: number) => void;
  onOpenDocDetails: (doc: DocumentItem) => void;
  onDownloadDoc: (doc: DocumentItem) => void;
  onDeleteDoc: (doc: DocumentItem) => void;
}

export default function DocumentsTab({
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
  hasNoEmbeddingModel,
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
  onDeleteDoc
}: DocumentsTabProps) {
  if (viewingDoc) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <DocumentDetailView
          viewingDoc={viewingDoc}
          docChunks={docChunks}
          loadingChunks={loadingChunks}
          chunkPage={chunkPage}
          chunkItemsPerPage={chunkItemsPerPage}
          onSetChunkPage={onSetChunkPage}
          onSetChunkItemsPerPage={onSetChunkItemsPerPage}
          onViewChunkModal={onViewChunkModal}
          onDeleteChunk={onDeleteChunk}
          onBack={() => onSetViewingDoc(null)}
        />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <IngestionBanner
        ingestingDoc={ingestingDoc}
        ingestProgress={ingestProgress}
        ingestStep={ingestStep}
        onCancelIngestion={onCancelIngestion}
      />

      {hasNoEmbeddingModel && (
        <div
          style={{
            border: "1px solid #fde68a",
            padding: "12px 16px",
            borderRadius: "8px",
            background: "#fffbeb",
            color: "#b45309",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "13px"
          }}
        >
          <AlertCircle style={{ width: "18px", height: "18px", flexShrink: 0 }} />
          <span>
            Embedding model is not configured. Please set up an embedding model in{" "}
            <strong>Dashboard &gt; Providers</strong> to enable document upload and retrieval search.
          </span>
        </div>
      )}

      <DocumentsToolbar
        hasNoEmbeddingModel={hasNoEmbeddingModel}
        onOpenUploadModal={onOpenUploadModal}
        docSearchInput={docSearchInput}
        onDocSearchInputChange={onDocSearchInputChange}
        onDocSearchSubmit={onDocSearchSubmit}
        onClearDocSearch={onClearDocSearch}
        onSetCurrentPage={onSetCurrentPage}
      />

      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e1dfdd",
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
        }}
      >
        <DocumentTable
          currentDocsPage={currentDocsPage}
          ingestingDoc={ingestingDoc}
          docSortColumn={docSortColumn}
          docSortDirection={docSortDirection}
          onDocSort={onDocSort}
          onOpenDocDetails={onOpenDocDetails}
          onDownloadDoc={onDownloadDoc}
          onDeleteDoc={onDeleteDoc}
        />

        <DocumentPagination
          totalFiltered={totalFiltered}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          totalPages={totalPages}
          startIndex={startIndex}
          endIndex={endIndex}
          onSetCurrentPage={onSetCurrentPage}
          onSetItemsPerPage={onSetItemsPerPage}
        />
      </div>
    </div>
  );
}
