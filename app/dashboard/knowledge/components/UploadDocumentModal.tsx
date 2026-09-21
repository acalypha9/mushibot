"use client";

import React from "react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { UploadCloud, AlertCircle } from "lucide-react";
import UploadFileDropzone from "./upload_modal/UploadFileDropzone";
import UploadOptionsSection from "./upload_modal/UploadOptionsSection";
import UploadAdvancedSettings from "./upload_modal/UploadAdvancedSettings";
import {
  UploadDocumentModalProps,
  isUploadSubmitDisabled,
} from "./upload_modal/uploadModalLogic";

export type { UploadDocumentModalProps };

export default function UploadDocumentModal({
  isOpen,
  onClose,
  selectedFile,
  dragActive,
  hasNoEmbeddingModel,
  uploadChunkSize,
  uploadChunkOverlap,
  convertToMd,
  saveParserOutput,
  showAdvancedSettings,
  uploadBatchSize,
  uploadConcurrentLimit,
  uploadMaxRetries,
  showUploadTooltip,
  fileInputRef,
  onSetSelectedFile,
  onSetDragActive,
  onSetUploadChunkSize,
  onSetUploadChunkOverlap,
  onSetConvertToMd,
  onSetSaveParserOutput,
  onSetShowAdvancedSettings,
  onSetUploadBatchSize,
  onSetUploadConcurrentLimit,
  onSetUploadMaxRetries,
  onSetShowUploadTooltip,
  onUploadSubmit,
}: UploadDocumentModalProps) {
  const isSubmitDisabled = isUploadSubmitDisabled({
    selectedFile,
    hasNoEmbeddingModel,
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Document"
      icon={<UploadCloud style={{ width: "20px", height: "20px", color: "var(--primary)" }} />}
      maxWidth="lg"
      footer={
        <>
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={onUploadSubmit}
            disabled={isSubmitDisabled}
          >
            Upload
          </Button>
        </>
      }
    >
      {hasNoEmbeddingModel && (
        <div
          style={{
            border: "1px solid #fde68a",
            padding: "10px 14px",
            borderRadius: "var(--radius-md, 8px)",
            background: "#fffbeb",
            color: "#b45309",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12.5px",
          }}
        >
          <AlertCircle style={{ width: "16px", height: "16px", flexShrink: 0 }} />
          <span>
            Embedding model is not configured. Please set up an embedding model in{" "}
            <strong>Dashboard &gt; Providers</strong> first.
          </span>
        </div>
      )}

      {/* Drag & Drop File Box */}
      <UploadFileDropzone
        selectedFile={selectedFile}
        dragActive={dragActive}
        fileInputRef={fileInputRef}
        onSetSelectedFile={onSetSelectedFile}
        onSetDragActive={onSetDragActive}
      />

      {/* Chunk and Ingestion Options */}
      <UploadOptionsSection
        selectedFile={selectedFile}
        uploadChunkSize={uploadChunkSize}
        uploadChunkOverlap={uploadChunkOverlap}
        convertToMd={convertToMd}
        saveParserOutput={saveParserOutput}
        showUploadTooltip={showUploadTooltip}
        onSetUploadChunkSize={onSetUploadChunkSize}
        onSetUploadChunkOverlap={onSetUploadChunkOverlap}
        onSetConvertToMd={onSetConvertToMd}
        onSetSaveParserOutput={onSetSaveParserOutput}
        onSetShowUploadTooltip={onSetShowUploadTooltip}
      />

      {/* Advanced Settings Collapsible Toggle */}
      <UploadAdvancedSettings
        showAdvancedSettings={showAdvancedSettings}
        uploadBatchSize={uploadBatchSize}
        uploadConcurrentLimit={uploadConcurrentLimit}
        uploadMaxRetries={uploadMaxRetries}
        onSetShowAdvancedSettings={onSetShowAdvancedSettings}
        onSetUploadBatchSize={onSetUploadBatchSize}
        onSetUploadConcurrentLimit={onSetUploadConcurrentLimit}
        onSetUploadMaxRetries={onSetUploadMaxRetries}
      />
    </Modal>
  );
}
