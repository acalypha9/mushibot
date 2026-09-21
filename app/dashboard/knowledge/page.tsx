"use client";

import { useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "../../auth";
import { useKnowledgeState } from "./useKnowledgeState";
import { useKnowledgeBinding } from "./useKnowledgeBinding";
import KnowledgeMainView from "./components/KnowledgeMainView";
import KnowledgeModals from "./components/KnowledgeModals";

function KnowledgeContent() {
  const { token, user } = useAuth();
  const searchParams = useSearchParams();
  const state = useKnowledgeState();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const ingestAbortControllerRef = useRef<AbortController | null>(null);

  const {
    availableEmbeddingModels,
    hasNoEmbeddingModel,
    mainViewProps,
    mutations,
    ingest,
  } = useKnowledgeBinding(token, state, {
    fileInputRef,
    progressIntervalRef,
    ingestAbortControllerRef,
  });

  const { dataState, formState, uiState } = state;
  const { errorMsg, collections } = dataState;

  // When collection query param is present or changes, direct inside that collection
  useEffect(() => {
    const colParam = searchParams.get("collection");
    if (!colParam || collections.length === 0) return;

    const match = collections.find(
      (c) => String(c.id) === colParam || c.name.toLowerCase() === colParam.toLowerCase()
    );

    if (match) {
      state.setSelectedCol(match);
      const tabParam = searchParams.get("tab") as any;
      if (tabParam && ["overview", "documents", "retrieval", "settings"].includes(tabParam)) {
        state.setActiveTab(tabParam);
      }
    } else {
      state.setErrorMsg(`Knowledge collection "${colParam}" does not exist or has been deleted.`);
    }
  }, [searchParams, collections]);

  // When custom event is fired from HeaderSearch
  useEffect(() => {
    const handleSelectEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail?.id || collections.length === 0) return;
      const match = collections.find(
        (c) => String(c.id) === detail.id || c.name.toLowerCase() === (detail.name || "").toLowerCase()
      );
      if (match) {
        state.setSelectedCol(match);
      }
    };
    window.addEventListener("select-knowledge-collection", handleSelectEvent);
    return () => window.removeEventListener("select-knowledge-collection", handleSelectEvent);
  }, [collections]);

  if (!user || user.role !== "ADMIN") {
    return (
      <div style={{ fontFamily: "var(--font-body)", color: "#a4262c", fontWeight: "bold" }}>
        UNAUTHORIZED. ADMIN ACCESS REQUIRED.
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100%",
        backgroundColor: "#faf9f8",
        padding: "28px 40px 60px 40px",
        boxSizing: "border-box",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: "#323130",
      }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
        {errorMsg && (
          <div
            style={{
              padding: "10px 14px",
              background: "#fde8e8",
              border: "1px solid #a4262c",
              color: "#a4262c",
              borderRadius: "4px",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <AlertTriangle style={{ width: "14px", height: "14px" }} /> {errorMsg}
          </div>
        )}

        <KnowledgeMainView {...mainViewProps} />

        <KnowledgeModals
          showCreateColModal={uiState.showCreateColModal}
          onCloseCreateColModal={() => {
            state.setShowCreateColModal(false);
            state.setColErrorMsg(null);
          }}
          colName={formState.colName}
          colDesc={formState.colDesc}
          colEmbeddingModel={formState.colEmbeddingModel}
          colParserModel={formState.colParserModel}
          colErrorMsg={formState.colErrorMsg}
          availableEmbeddingModels={availableEmbeddingModels}
          onSetColName={state.setColName}
          onSetColDesc={state.setColDesc}
          onSetColEmbeddingModel={state.setColEmbeddingModel}
          onSetColParserModel={state.setColParserModel}
          onCreateCollection={mutations.handleCreateCollection}
          editingCol={uiState.editingCol}
          onCloseEditColModal={() => state.setEditingCol(null)}
          onUpdateCollection={mutations.handleUpdateCollection}
          showUploadModal={uiState.showUploadModal}
          onCloseUploadModal={() => {
            state.setShowUploadModal(false);
            state.setSelectedFile(null);
          }}
          selectedFile={uiState.selectedFile}
          dragActive={uiState.dragActive}
          hasNoEmbeddingModel={hasNoEmbeddingModel}
          uploadChunkSize={uiState.uploadChunkSize}
          uploadChunkOverlap={uiState.uploadChunkOverlap}
          convertToMd={uiState.convertToMd}
          saveParserOutput={uiState.saveParserOutput}
          showAdvancedSettings={uiState.showAdvancedSettings}
          uploadBatchSize={uiState.uploadBatchSize}
          uploadConcurrentLimit={uiState.uploadConcurrentLimit}
          uploadMaxRetries={uiState.uploadMaxRetries}
          showUploadTooltip={uiState.showUploadTooltip}
          fileInputRef={fileInputRef}
          onSetSelectedFile={state.setSelectedFile}
          onSetDragActive={state.setDragActive}
          onSetUploadChunkSize={state.setUploadChunkSize}
          onSetUploadChunkOverlap={state.setUploadChunkOverlap}
          onSetConvertToMd={state.setConvertToMd}
          onSetSaveParserOutput={state.setSaveParserOutput}
          onSetShowAdvancedSettings={state.setShowAdvancedSettings}
          onSetUploadBatchSize={state.setUploadBatchSize}
          onSetUploadConcurrentLimit={state.setUploadConcurrentLimit}
          onSetUploadMaxRetries={state.setUploadMaxRetries}
          onSetShowUploadTooltip={state.setShowUploadTooltip}
          onUploadSubmit={ingest.handleUploadModalSubmit}
          viewingChunkModal={uiState.viewingChunkModal}
          copiedChunkId={uiState.copiedChunkId}
          onCloseChunkViewer={() => state.setViewingChunkModal(null)}
          onCopyChunk={(chunk) => {
            navigator.clipboard.writeText(chunk.content);
            state.setCopiedChunkId(chunk.id);
            setTimeout(() => state.setCopiedChunkId(null), 2000);
          }}
          deleteTarget={uiState.deleteTarget}
          deleting={uiState.deleting}
          onCloseDeleteModal={() => state.setDeleteTarget(null)}
          onConfirmDelete={async () => {
            if (!uiState.deleteTarget) return;
            state.setDeleting(true);
            try {
              await uiState.deleteTarget.onConfirm();
            } finally {
              state.setDeleting(false);
              state.setDeleteTarget(null);
            }
          }}
        />
      </div>
    </div>
  );
}

export default function KnowledgePage() {
  return (
    <Suspense fallback={null}>
      <KnowledgeContent />
    </Suspense>
  );
}
