import type { FormEvent, RefObject } from "react";

export const ACCEPTED_FILE_EXTENSIONS = ".txt,.md,.markdown,.rst,.adoc,.pdf,.docx,.epub,.xls,.xlsx";
export const MAX_FILE_SIZE_BYTES = 128 * 1024 * 1024;
export const MAX_FILE_SIZE_LABEL = "128MB";

export interface NamedFileLike {
  name: string;
  size?: number;
}

export interface EffectiveToggleStates {
  isSelectedFileMd: boolean;
  isMdChecked: boolean;
  isParserChecked: boolean;
}

export function isMarkdownOrTextFile(file: NamedFileLike | null | undefined): boolean {
  if (!file || !file.name) return false;
  const lower = file.name.toLowerCase();
  return lower.endsWith(".md") || lower.endsWith(".markdown") || lower.endsWith(".txt");
}

export function computeEffectiveToggleStates({
  selectedFile,
  convertToMd,
  saveParserOutput,
}: {
  selectedFile: NamedFileLike | null | undefined;
  convertToMd: boolean;
  saveParserOutput: boolean;
}): EffectiveToggleStates {
  const isSelectedFileMd = isMarkdownOrTextFile(selectedFile);
  return {
    isSelectedFileMd,
    isMdChecked: isSelectedFileMd ? false : convertToMd,
    isParserChecked: isSelectedFileMd ? false : saveParserOutput,
  };
}

export function isUploadSubmitDisabled({
  selectedFile,
  hasNoEmbeddingModel,
}: {
  selectedFile: NamedFileLike | null | undefined;
  hasNoEmbeddingModel: boolean;
}): boolean {
  return !selectedFile || hasNoEmbeddingModel;
}

export function buildUploadDocumentPayload({
  collectionId,
  file,
  convertToMd,
  saveParserOutput,
  chunkSize,
  chunkOverlap,
}: {
  collectionId: string;
  file: NamedFileLike;
  convertToMd: boolean;
  saveParserOutput: boolean;
  chunkSize: number;
  chunkOverlap: number;
}): {
  collection_id: string;
  title: string;
  document_type: string;
  convert_to_md: string;
  save_parser_output: string;
  chunk_size: string;
  chunk_overlap: string;
  file: NamedFileLike;
} {
  const isMd = isMarkdownOrTextFile(file);
  return {
    collection_id: collectionId,
    title: file.name,
    document_type: "POLICY",
    convert_to_md: (isMd || convertToMd).toString(),
    save_parser_output: saveParserOutput.toString(),
    chunk_size: chunkSize.toString(),
    chunk_overlap: chunkOverlap.toString(),
    file,
  };
}

export interface UploadModalStateSnapshot {
  selectedFile: File | null;
  dragActive: boolean;
  uploadChunkSize: number;
  uploadChunkOverlap: number;
  convertToMd: boolean;
  saveParserOutput: boolean;
  showAdvancedSettings: boolean;
  uploadBatchSize: number;
  uploadConcurrentLimit: number;
  uploadMaxRetries: number;
  showUploadTooltip: boolean;
}

export function getDefaultUploadModalState(): UploadModalStateSnapshot {
  return {
    selectedFile: null,
    dragActive: false,
    uploadChunkSize: 512,
    uploadChunkOverlap: 50,
    convertToMd: true,
    saveParserOutput: false,
    showAdvancedSettings: false,
    uploadBatchSize: 10,
    uploadConcurrentLimit: 3,
    uploadMaxRetries: 3,
    showUploadTooltip: false,
  };
}

export interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  fileInputRef: RefObject<HTMLInputElement | null>;
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
  onUploadSubmit: (e: FormEvent) => Promise<void>;
}
