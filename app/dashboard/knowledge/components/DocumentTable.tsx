"use client";

import React from "react";
import { ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react";
import { DocumentItem } from "../types";
import { DocSortColumn, getSortAriaSort } from "./documentsLogic";
import DocumentRow from "./DocumentRow";

interface DocumentTableProps {
  currentDocsPage: DocumentItem[];
  ingestingDoc: DocumentItem | null;
  docSortColumn: DocSortColumn;
  docSortDirection: "asc" | "desc";
  onDocSort: (col: DocSortColumn) => void;
  onOpenDocDetails: (doc: DocumentItem) => void;
  onDownloadDoc: (doc: DocumentItem) => void;
  onDeleteDoc: (doc: DocumentItem) => void;
}

export default function DocumentTable({
  currentDocsPage,
  ingestingDoc,
  docSortColumn,
  docSortDirection,
  onDocSort,
  onOpenDocDetails,
  onDownloadDoc,
  onDeleteDoc
}: DocumentTableProps) {
  const renderSortIndicator = (col: DocSortColumn) => {
    if (docSortColumn !== col) {
      return <ArrowUpDown style={{ width: "12px", height: "12px", opacity: 0.4 }} />;
    }
    return docSortDirection === "asc" ? (
      <ChevronUp style={{ width: "14px", height: "14px", color: "#742774" }} />
    ) : (
      <ChevronDown style={{ width: "14px", height: "14px", color: "#742774" }} />
    );
  };

  const renderTh = (col: DocSortColumn, label: string) => (
    <th
      onClick={() => onDocSort(col)}
      style={{ padding: "12px 16px", fontWeight: "600", cursor: "pointer", transition: "color 0.15s ease" }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "#742774")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "#605e5c")}
      role="columnheader"
      aria-sort={getSortAriaSort(docSortColumn, col, docSortDirection)}
    >
      <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
        {label}
        {renderSortIndicator(col)}
      </div>
    </th>
  );

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e1dfdd",
        borderRadius: "8px",
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
        <thead>
          <tr
            style={{
              borderBottom: "1px solid #e1dfdd",
              color: "#605e5c",
              backgroundColor: "#faf9f8",
              userSelect: "none"
            }}
          >
            {renderTh("name", "Name")}
            {renderTh("type", "Type")}
            {renderTh("size", "Size")}
            {renderTh("chunks", "Chunks")}
            {renderTh("created_at", "Uploaded At")}
            <th style={{ padding: "12px 16px", fontWeight: "600", textAlign: "right" }} role="columnheader">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {currentDocsPage.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ padding: "36px", textAlign: "center", color: "#605e5c" }}>
                No documents found. Click &quot;Upload Document&quot; to add files.
              </td>
            </tr>
          ) : (
            currentDocsPage.map((d) => (
              <DocumentRow
                key={d.id}
                document={d}
                isIngesting={ingestingDoc?.id === d.id}
                onOpenDocDetails={onOpenDocDetails}
                onDownloadDoc={onDownloadDoc}
                onDeleteDoc={onDeleteDoc}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
