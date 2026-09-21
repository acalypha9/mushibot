import React from "react";

export interface Collection {
  id: string;
  name: string;
  description?: string;
  document_count: number;
  chunk_count: number;
  chunk_size?: number;
  chunk_overlap?: number;
  embedding_model?: string;
  embedding_dimension?: number;
  llama_cloud_api_key?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentItem {
  id: string;
  collection_id: string;
  title: string;
  document_type: string;
  source_type: string;
  file_size: number;
  status: string;
  ingestion_status: string;
  chunk_count: number;
  version: number;
  created_at: string;
  updated_at?: string;
  convert_to_md?: boolean;
  save_parser_output?: boolean;
  markdown_text?: string;
  content_text?: string;
}

export interface ChunkItem {
  id: string;
  index: number;
  content: string;
  char_count: number;
}

export interface DeleteTarget {
  title: string;
  name: string;
  warning: string;
  onConfirm: () => Promise<void>;
}

export interface KBSettings {
  llama_cloud_api_key: string;
  chunk_size: number;
  chunk_overlap: number;
  embedding_model: string;
  active_collection_id?: string;
  active_collection_ids?: string[];
  retrieval_k?: number;
}

export interface RetrievalItem {
  page_content: string;
  metadata: Record<string, unknown>;
  score: number;
}

export const getActiveCollectionIds = (st: KBSettings): string[] => {
  if (Array.isArray(st.active_collection_ids) && st.active_collection_ids.length > 0) {
    return st.active_collection_ids;
  }
  if (st.active_collection_id) {
    return st.active_collection_id.split(",").map(s => s.trim()).filter(Boolean);
  }
  return [];
};

export function getDisplayTitle(doc: DocumentItem | string | null | undefined): string {
  if (!doc) return "";
  let title = typeof doc === "object" ? doc.title : doc;
  const isConverted = typeof doc === "object" ? doc.convert_to_md : false;
  if (isConverted && title) {
    title = title.replace(/\.(pdf|docx|doc|txt)$/i, ".md");
  }
  return title;
}

export function getFileType(doc: DocumentItem | string | null | undefined): string {
  if (!doc) return "doc";
  if (typeof doc === "object" && doc.convert_to_md) {
    return "md";
  }
  const title = getDisplayTitle(doc);
  const lower = title.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".md")) return "md";
  if (lower.endsWith(".txt")) return "txt";
  if (lower.endsWith(".docx") || lower.endsWith(".doc")) return "docx";
  return "doc";
}

export function renderFileTypeBadge(ext: string) {
  switch (ext) {
    case "pdf":
      return (
        <span style={{ padding: "2px 6px", background: "#a4262c", color: "#ffffff", borderRadius: "4px", fontSize: "9px", fontWeight: "800", textTransform: "uppercase" }}>
          PDF
        </span>
      );
    case "md":
      return (
        <span style={{ padding: "2px 6px", background: "#742774", color: "#ffffff", borderRadius: "4px", fontSize: "9px", fontWeight: "800", textTransform: "uppercase" }}>
          MD
        </span>
      );
    case "txt":
      return (
        <span style={{ padding: "2px 6px", background: "#502450", color: "#ffffff", borderRadius: "4px", fontSize: "9px", fontWeight: "800", textTransform: "uppercase" }}>
          TXT
        </span>
      );
    case "docx":
      return (
        <span style={{ padding: "2px 6px", background: "#323130", color: "#ffffff", borderRadius: "4px", fontSize: "9px", fontWeight: "800", textTransform: "uppercase" }}>
          DOCX
        </span>
      );
    default:
      return (
        <span style={{ padding: "2px 6px", background: "#605e5c", color: "#ffffff", borderRadius: "4px", fontSize: "9px", fontWeight: "800", textTransform: "uppercase" }}>
          DOC
        </span>
      );
  }
}
