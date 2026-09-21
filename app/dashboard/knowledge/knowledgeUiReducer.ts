import { Collection, DocumentItem, ChunkItem, DeleteTarget, RetrievalItem } from "./types";

export interface KnowledgeUiState {
  showCreateColModal: boolean;
  editingCol: Collection | null;
  showRetrievalTooltip: boolean;
  showUploadTooltip: boolean;
  showUploadModal: boolean;
  selectedFile: File | null;
  dragActive: boolean;
  convertToMd: boolean;
  saveParserOutput: boolean;
  showAdvancedSettings: boolean;
  uploadChunkSize: number;
  uploadChunkOverlap: number;
  uploadBatchSize: number;
  uploadConcurrentLimit: number;
  uploadMaxRetries: number;
  docSearchInput: string;
  docSearchQuery: string;
  colSearchInput: string;
  colSearchQuery: string;
  colViewMode: "grid" | "list";
  itemsPerPage: number;
  currentPage: number;
  ingestingDoc: DocumentItem | null;
  ingestProgress: number;
  ingestStep: string;
  viewingDoc: DocumentItem | null;
  docChunks: ChunkItem[];
  loadingChunks: boolean;
  chunkPage: number;
  chunkItemsPerPage: number;
  viewingChunkModal: ChunkItem | null;
  copiedChunkId: string | null;
  docSortColumn: "name" | "type" | "size" | "chunks" | "created_at";
  docSortDirection: "asc" | "desc";
  deleteTarget: DeleteTarget | null;
  deleting: boolean;
  retrievalQuery: string;
  retrievalTopK: number;
  retrievalLoading: boolean;
  retrievalResults: RetrievalItem[];
}

export type KnowledgeUiAction =
  | {
      type: "SET_FIELD";
      field: keyof KnowledgeUiState;
      payload:
        | KnowledgeUiState[keyof KnowledgeUiState]
        | ((prev: KnowledgeUiState[keyof KnowledgeUiState]) => KnowledgeUiState[keyof KnowledgeUiState]);
    }
  | { type: "TOGGLE_DOC_SORT"; column: "name" | "type" | "size" | "chunks" | "created_at" };

export function knowledgeUiReducer(state: KnowledgeUiState, action: KnowledgeUiAction): KnowledgeUiState {
  switch (action.type) {
    case "SET_FIELD": {
      const currentVal = state[action.field];
      const nextVal =
        typeof action.payload === "function"
          ? (action.payload as (prev: unknown) => unknown)(currentVal)
          : action.payload;
      if (currentVal === nextVal) return state;
      return { ...state, [action.field]: nextVal as KnowledgeUiState[keyof KnowledgeUiState] };
    }
    case "TOGGLE_DOC_SORT":
      if (state.docSortColumn === action.column) {
        return {
          ...state,
          docSortDirection: state.docSortDirection === "asc" ? "desc" : "asc",
        };
      }
      return {
        ...state,
        docSortColumn: action.column,
        docSortDirection: "asc",
      };
    default:
      return state;
  }
}
