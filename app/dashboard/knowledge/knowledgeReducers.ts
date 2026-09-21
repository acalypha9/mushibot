import { Collection, DocumentItem, KBSettings } from "./types";

export interface KnowledgeDataState {
  collections: Collection[];
  selectedCol: Collection | null;
  activeTab: "overview" | "documents" | "retrieval" | "settings";
  documents: DocumentItem[];
  settings: KBSettings;
  loading: boolean;
  errorMsg: string | null;
  successMsg: string | null;
  refreshTrigger: number;
  embeddingProviders: Array<{
    category?: string;
    model_name?: string;
    config?: {
      configured_models?: Array<{
        name?: string;
        id?: string;
        is_active?: boolean;
      }>;
    };
  }>;
}

export type KnowledgeDataAction =
  | { type: "SET_COLLECTIONS"; payload: Collection[] | ((prev: Collection[]) => Collection[]) }
  | { type: "SET_SELECTED_COL"; payload: Collection | null | ((prev: Collection | null) => Collection | null) }
  | { type: "SET_ACTIVE_TAB"; payload: "overview" | "documents" | "retrieval" | "settings" }
  | { type: "SET_DOCUMENTS"; payload: DocumentItem[] | ((prev: DocumentItem[]) => DocumentItem[]) }
  | { type: "SET_SETTINGS"; payload: KBSettings | ((prev: KBSettings) => KBSettings) }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR_MSG"; payload: string | null }
  | { type: "SET_SUCCESS_MSG"; payload: string | null }
  | { type: "TRIGGER_REFRESH" }
  | { type: "SET_EMBEDDING_PROVIDERS"; payload: KnowledgeDataState["embeddingProviders"] };

export function knowledgeDataReducer(state: KnowledgeDataState, action: KnowledgeDataAction): KnowledgeDataState {
  switch (action.type) {
    case "SET_COLLECTIONS": {
      const nextCols = typeof action.payload === "function" ? action.payload(state.collections) : action.payload;
      if (state.collections === nextCols) return state;
      return { ...state, collections: nextCols };
    }
    case "SET_SELECTED_COL": {
      const nextCol = typeof action.payload === "function" ? action.payload(state.selectedCol) : action.payload;
      if (state.selectedCol === nextCol) return state;
      return { ...state, selectedCol: nextCol };
    }
    case "SET_ACTIVE_TAB":
      if (state.activeTab === action.payload) return state;
      return { ...state, activeTab: action.payload };
    case "SET_DOCUMENTS": {
      const nextDocs = typeof action.payload === "function" ? action.payload(state.documents) : action.payload;
      if (state.documents === nextDocs) return state;
      return { ...state, documents: nextDocs };
    }
    case "SET_SETTINGS": {
      const nextSettings = typeof action.payload === "function" ? action.payload(state.settings) : action.payload;
      if (state.settings === nextSettings) return state;
      return { ...state, settings: nextSettings };
    }
    case "SET_LOADING":
      if (state.loading === action.payload) return state;
      return { ...state, loading: action.payload };
    case "SET_ERROR_MSG":
      if (state.errorMsg === action.payload) return state;
      return { ...state, errorMsg: action.payload };
    case "SET_SUCCESS_MSG":
      if (state.successMsg === action.payload) return state;
      return { ...state, successMsg: action.payload };
    case "TRIGGER_REFRESH":
      return { ...state, refreshTrigger: state.refreshTrigger + 1 };
    case "SET_EMBEDDING_PROVIDERS":
      if (state.embeddingProviders === action.payload) return state;
      return { ...state, embeddingProviders: action.payload };
    default:
      return state;
  }
}

export interface KnowledgeFormState {
  colName: string;
  colDesc: string;
  colEmbeddingModel: string;
  colParserModel: string;
  colErrorMsg: string | null;
  llamaKeyInput: string;
  chunkSizeInput: number | string;
  chunkOverlapInput: number | string;
  retrievalKInput: number | string;
  embeddingModelInput: string;
  parseModelInput: string;
  hasUnsavedChanges: boolean;
  isSaved: boolean;
}

export type KnowledgeFormAction =
  | { type: "SET_FIELD"; field: keyof KnowledgeFormState; payload: KnowledgeFormState[keyof KnowledgeFormState] }
  | { type: "RESET_FORM"; payload: Partial<KnowledgeFormState> };

export function knowledgeFormReducer(state: KnowledgeFormState, action: KnowledgeFormAction): KnowledgeFormState {
  switch (action.type) {
    case "SET_FIELD":
      if (state[action.field] === action.payload) return state;
      return { ...state, [action.field]: action.payload };
    case "RESET_FORM": {
      const isSame = Object.entries(action.payload).every(
        ([k, v]) => state[k as keyof KnowledgeFormState] === v
      );
      if (isSame) return state;
      return { ...state, ...action.payload };
    }
    default:
      return state;
  }
}
