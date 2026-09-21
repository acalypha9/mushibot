import { DocumentItem } from "../types";

export type DocSortColumn = "name" | "type" | "size" | "chunks" | "created_at";

export function getIngestionStepLabel(doc: DocumentItem | null): string {
  if (!doc) return "";
  const isMd =
    doc.title.toLowerCase().endsWith(".md") ||
    doc.title.toLowerCase().endsWith(".markdown") ||
    doc.title.toLowerCase().endsWith(".txt") ||
    doc.convert_to_md === false;

  return isMd
    ? "Chunking Text \u2192 Generating Embeddings \u2192 Storing Vectors"
    : "Parsing Document \u2192 Chunking Text \u2192 Generating Embeddings \u2192 Storing Vectors";
}

export function formatDocPaginationRange(totalFiltered: number, startIndex: number, endIndex: number): string {
  if (totalFiltered === 0) return "0-0 of 0";
  return `${startIndex + 1}-${endIndex} of ${totalFiltered}`;
}

export function getDocActionAriaLabel(action: "view" | "download" | "delete", docTitle: string): string {
  switch (action) {
    case "view":
      return `View details for ${docTitle}`;
    case "download":
      return `Download ${docTitle}`;
    case "delete":
      return `Delete ${docTitle}`;
    default:
      return `${action} ${docTitle}`;
  }
}

export function getSortAriaSort(
  activeCol: DocSortColumn,
  targetCol: DocSortColumn,
  direction: "asc" | "desc"
): "ascending" | "descending" | "none" {
  if (activeCol !== targetCol) return "none";
  return direction === "asc" ? "ascending" : "descending";
}
