import { useMemo } from "react";
import { DocumentItem, getDisplayTitle, getFileType } from "./types";

interface UseDerivedKnowledgeDataParams {
  documents: DocumentItem[];
  docSearchQuery: string;
  docSortColumn: "name" | "type" | "size" | "chunks" | "created_at";
  docSortDirection: "asc" | "desc";
  itemsPerPage: number;
  currentPage: number;
}

export function useDerivedKnowledgeData({
  documents,
  docSearchQuery,
  docSortColumn,
  docSortDirection,
  itemsPerPage,
  currentPage,
}: UseDerivedKnowledgeDataParams) {
  const filteredDocs = useMemo(() => {
    return documents.filter((d) => {
      if (!docSearchQuery) return true;
      const q = docSearchQuery.toLowerCase();
      return d.title.toLowerCase().includes(q) || d.document_type.toLowerCase().includes(q);
    });
  }, [documents, docSearchQuery]);

  const sortedDocs = useMemo(() => {
    return [...filteredDocs].sort((a, b) => {
      let valA: string | number = "";
      let valB: string | number = "";
      if (docSortColumn === "name") {
        valA = getDisplayTitle(a).toLowerCase();
        valB = getDisplayTitle(b).toLowerCase();
      } else if (docSortColumn === "type") {
        valA = getFileType(a).toLowerCase();
        valB = getFileType(b).toLowerCase();
      } else if (docSortColumn === "size") {
        valA = a.file_size || 0;
        valB = b.file_size || 0;
      } else if (docSortColumn === "chunks") {
        valA = a.chunk_count || 0;
        valB = b.chunk_count || 0;
      } else if (docSortColumn === "created_at") {
        valA = new Date(a.created_at).getTime();
        valB = new Date(b.created_at).getTime();
      }

      if (valA < valB) return docSortDirection === "asc" ? -1 : 1;
      if (valA > valB) return docSortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredDocs, docSortColumn, docSortDirection]);

  const totalFiltered = sortedDocs.length;
  const totalPages = Math.ceil(totalFiltered / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalFiltered);
  const currentDocsPage = useMemo(() => {
    return sortedDocs.slice(startIndex, endIndex);
  }, [sortedDocs, startIndex, endIndex]);

  return {
    filteredDocs,
    sortedDocs,
    totalFiltered,
    totalPages,
    startIndex,
    endIndex,
    currentDocsPage,
  };
}
