import React from "react";
import CreateCollectionModal from "./CreateCollectionModal";
import EditCollectionModal from "./EditCollectionModal";
import UploadDocumentModal from "./UploadDocumentModal";
import ChunkViewerModal from "./ChunkViewerModal";
import DeleteConfirmModal from "./DeleteConfirmModal";
import { Collection, ChunkItem, DeleteTarget } from "../types";

interface KnowledgeModalsProps {
  showCreateColModal: boolean;
  onCloseCreateColModal: () => void;
  colName: string;
  colDesc: string;
  colEmbeddingModel: string;
  colParserModel: string;
  colErrorMsg: string | null;
  availableEmbeddingModels: string[];
  onSetColName: (val: string) => void;
  onSetColDesc: (val: string) => void;
  onSetColEmbeddingModel: (val: string) => void;
  onSetColParserModel: (val: string) => void;
  onCreateCollection: (e: React.FormEvent) => Promise<void>;

  editingCol: Collection | null;
  onCloseEditColModal: () => void;
  onUpdateCollection: (e: React.FormEvent) => Promise<void>;

  showUploadModal: boolean;
  onCloseUploadModal: () => void;
  selectedFile: File | null;
  dragActive: boolean;
  hasNoEmbeddingModel: boolean;
  uploadChunkSize: number;
  uploadChunkOverlap: number;
  convertToMd: boolean;
  saveParserOutput: boolean;
  showAdvancedSettings: boolean;
  uploadBatchSize: number;
  uploadConcurrentLimit: number;
  uploadMaxRetries: number;
  showUploadTooltip: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onSetSelectedFile: (file: File | null) => void;
  onSetDragActive: (active: boolean) => void;
  onSetUploadChunkSize: (size: number) => void;
  onSetUploadChunkOverlap: (overlap: number) => void;
  onSetConvertToMd: (convert: boolean) => void;
  onSetSaveParserOutput: (save: boolean) => void;
  onSetShowAdvancedSettings: (show: boolean | ((prev: boolean) => boolean)) => void;
  onSetUploadBatchSize: (size: number) => void;
  onSetUploadConcurrentLimit: (limit: number) => void;
  onSetUploadMaxRetries: (retries: number) => void;
  onSetShowUploadTooltip: (show: boolean | ((prev: boolean) => boolean)) => void;
  onUploadSubmit: (e: React.FormEvent) => Promise<void>;

  viewingChunkModal: ChunkItem | null;
  copiedChunkId: string | null;
  onCloseChunkViewer: () => void;
  onCopyChunk: (chunk: ChunkItem) => void;

  deleteTarget: DeleteTarget | null;
  deleting: boolean;
  onCloseDeleteModal: () => void;
  onConfirmDelete: () => Promise<void>;
}

export default function KnowledgeModals({
  showCreateColModal,
  onCloseCreateColModal,
  colName,
  colDesc,
  colEmbeddingModel,
  colParserModel,
  colErrorMsg,
  availableEmbeddingModels,
  onSetColName,
  onSetColDesc,
  onSetColEmbeddingModel,
  onSetColParserModel,
  onCreateCollection,
  editingCol,
  onCloseEditColModal,
  onUpdateCollection,
  showUploadModal,
  onCloseUploadModal,
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
  viewingChunkModal,
  copiedChunkId,
  onCloseChunkViewer,
  onCopyChunk,
  deleteTarget,
  deleting,
  onCloseDeleteModal,
  onConfirmDelete,
}: KnowledgeModalsProps) {
  return (
    <>
      <CreateCollectionModal
        isOpen={showCreateColModal}
        onClose={onCloseCreateColModal}
        colName={colName}
        colDesc={colDesc}
        colEmbeddingModel={colEmbeddingModel}
        colParserModel={colParserModel}
        colErrorMsg={colErrorMsg}
        availableEmbeddingModels={availableEmbeddingModels}
        onSetColName={onSetColName}
        onSetColDesc={onSetColDesc}
        onSetColEmbeddingModel={onSetColEmbeddingModel}
        onSetColParserModel={onSetColParserModel}
        onCreateCollection={onCreateCollection}
      />

      <EditCollectionModal
        editingCol={editingCol}
        onClose={onCloseEditColModal}
        colName={colName}
        colDesc={colDesc}
        onSetColName={onSetColName}
        onSetColDesc={onSetColDesc}
        onUpdateCollection={onUpdateCollection}
      />

      <UploadDocumentModal
        isOpen={showUploadModal}
        onClose={onCloseUploadModal}
        selectedFile={selectedFile}
        dragActive={dragActive}
        hasNoEmbeddingModel={hasNoEmbeddingModel}
        uploadChunkSize={uploadChunkSize}
        uploadChunkOverlap={uploadChunkOverlap}
        convertToMd={convertToMd}
        saveParserOutput={saveParserOutput}
        showAdvancedSettings={showAdvancedSettings}
        uploadBatchSize={uploadBatchSize}
        uploadConcurrentLimit={uploadConcurrentLimit}
        uploadMaxRetries={uploadMaxRetries}
        showUploadTooltip={showUploadTooltip}
        fileInputRef={fileInputRef}
        onSetSelectedFile={onSetSelectedFile}
        onSetDragActive={onSetDragActive}
        onSetUploadChunkSize={onSetUploadChunkSize}
        onSetUploadChunkOverlap={onSetUploadChunkOverlap}
        onSetConvertToMd={onSetConvertToMd}
        onSetSaveParserOutput={onSetSaveParserOutput}
        onSetShowAdvancedSettings={onSetShowAdvancedSettings}
        onSetUploadBatchSize={onSetUploadBatchSize}
        onSetUploadConcurrentLimit={onSetUploadConcurrentLimit}
        onSetUploadMaxRetries={onSetUploadMaxRetries}
        onSetShowUploadTooltip={onSetShowUploadTooltip}
        onUploadSubmit={onUploadSubmit}
      />

      <ChunkViewerModal
        viewingChunkModal={viewingChunkModal}
        copiedChunkId={copiedChunkId}
        onClose={onCloseChunkViewer}
        onCopyChunk={onCopyChunk}
      />

      <DeleteConfirmModal
        deleteTarget={deleteTarget}
        deleting={deleting}
        onClose={onCloseDeleteModal}
        onConfirmDelete={onConfirmDelete}
      />
    </>
  );
}
