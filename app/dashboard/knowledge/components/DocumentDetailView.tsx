"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import {
  ArrowLeft,
  Layers,
  Database,
  BookOpen,
  Calendar,
  Clock,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight
} from "lucide-react";
import { formatDateCustom, formatBytes } from "@/lib/utils/formatters";
import { DocumentItem, ChunkItem, getDisplayTitle, getFileType } from "../types";
import DocumentChunksTable from "./DocumentChunksTable";

interface DocumentDetailViewProps {
  viewingDoc: DocumentItem;
  docChunks: ChunkItem[];
  loadingChunks: boolean;
  chunkPage: number;
  chunkItemsPerPage: number;
  onSetChunkPage: (page: number | ((prev: number) => number)) => void;
  onSetChunkItemsPerPage: (count: number) => void;
  onViewChunkModal: (chunk: ChunkItem) => void;
  onDeleteChunk: (chunk: ChunkItem) => void;
  onBack?: () => void;
}

const cardStyle: React.CSSProperties = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "16px",
  padding: "20px 24px",
  boxShadow: "var(--shadow-sm)",
  display: "flex",
  flexDirection: "column",
  gap: "14px"
};

const iconBoxStyle: React.CSSProperties = {
  width: "36px",
  height: "36px",
  borderRadius: "8px",
  background: "#f8fafc",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid #e2e8f0"
};

export default function DocumentDetailView({
  viewingDoc,
  docChunks,
  loadingChunks,
  chunkPage,
  chunkItemsPerPage,
  onSetChunkPage,
  onSetChunkItemsPerPage,
  onViewChunkModal,
  onDeleteChunk,
  onBack
}: DocumentDetailViewProps) {
  const totalChunkPages = Math.ceil(docChunks.length / chunkItemsPerPage) || 1;
  const chunkStartIndex = (chunkPage - 1) * chunkItemsPerPage;
  const chunkEndIndex = Math.min(chunkStartIndex + chunkItemsPerPage, docChunks.length);
  const currentChunksPage = docChunks.slice(chunkStartIndex, chunkEndIndex);
  const title = getDisplayTitle(viewingDoc);

  return (
    <>
      {onBack && (
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            style={{ padding: "4px" }}
            aria-label="Back to documents list"
            title="Back to documents list"
          >
            <ArrowLeft style={{ width: "20px", height: "20px" }} />
          </Button>
          <div>
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: "800",
                color: "#0E2440",
                margin: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "600px"
              }}
              title={title}
            >
              {title}
            </h2>
            <p style={{ fontSize: "12px", color: "var(--muted-foreground)", margin: 0 }}>
              Document Details
            </p>
          </div>
        </div>
      )}

      <div style={cardStyle}>
        <h3 style={{ fontSize: "15px", fontWeight: "bold", color: "#0E2440", margin: 0 }}>
          Document Information
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "20px", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>Document Name</div>
              <div style={{ fontSize: "12.5px", fontWeight: "bold", color: "#0E2440", display: "flex", alignItems: "center", gap: "6px", overflow: "hidden" }}>
                <span
                  style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "inline-block", maxWidth: "180px" }}
                  title={title}
                >
                  {title}
                </span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={iconBoxStyle}>
              {getFileType(viewingDoc) === "md" ? (
                <span style={{ padding: "2px 4px", background: "#742774", color: "#ffffff", borderRadius: "4px", fontSize: "10px", fontWeight: "900", textTransform: "uppercase" }}>MD</span>
              ) : (
                <Layers style={{ width: "18px", height: "18px", color: "#742774" }} />
              )}
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>File Type</div>
              <div style={{ fontSize: "12.5px", fontWeight: "bold", color: "#0E2440" }}>{getFileType(viewingDoc)}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={iconBoxStyle}><Database style={{ width: "18px", height: "18px", color: "#742774" }} /></div>
            <div>
              <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>File Size</div>
              <div style={{ fontSize: "12.5px", fontWeight: "bold", color: "#0E2440", fontFamily: "var(--font-mono)" }}>{formatBytes(viewingDoc.file_size)}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={iconBoxStyle}><BookOpen style={{ width: "18px", height: "18px", color: "#742774" }} /></div>
            <div>
              <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>Chunk Count</div>
              <div style={{ fontSize: "12.5px", fontWeight: "bold", color: "#0E2440", fontFamily: "var(--font-mono)" }}>{docChunks.length || viewingDoc.chunk_count}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={iconBoxStyle}><Calendar style={{ width: "18px", height: "18px", color: "#742774" }} /></div>
            <div>
              <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>Uploaded At</div>
              <div style={{ fontSize: "12.5px", fontWeight: "bold", color: "#0E2440" }}>{formatDateCustom(viewingDoc.created_at)}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={iconBoxStyle}><Clock style={{ width: "18px", height: "18px", color: "#742774" }} /></div>
            <div>
              <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>Updated At</div>
              <div style={{ fontSize: "12.5px", fontWeight: "bold", color: "#0E2440" }}>{formatDateCustom(viewingDoc.updated_at || viewingDoc.created_at)}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ ...cardStyle, gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "bold", color: "#0E2440", margin: 0 }}>Chunks</h3>
          <span style={{ fontSize: "11px", padding: "3px 10px", background: "#f1f5f9", borderRadius: "12px", color: "#64748b", fontWeight: "bold" }}>
            {docChunks.length} Chunks
          </span>
        </div>

        <DocumentChunksTable
          docChunks={docChunks}
          currentChunksPage={currentChunksPage}
          loadingChunks={loadingChunks}
          onViewChunkModal={onViewChunkModal}
          onDeleteChunk={onDeleteChunk}
        />

        {!loadingChunks && docChunks.length > 0 && (
          <div style={{ padding: "12px 0 0 0", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "20px", fontSize: "12px", color: "var(--muted-foreground)", borderTop: "1px solid var(--border)", marginTop: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span>Items per page:</span>
              <Select
                value={chunkItemsPerPage}
                onChange={(e) => {
                  onSetChunkItemsPerPage(Number(e.target.value));
                  onSetChunkPage(1);
                }}
                style={{ padding: "4px 8px", fontSize: "12px", width: "auto" }}
                aria-label="Chunk items per page"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </Select>
            </div>
            <div>
              {docChunks.length === 0 ? "0-0 of 0" : `${chunkStartIndex + 1}-${chunkEndIndex} of ${docChunks.length}`}
            </div>
            <div style={{ display: "flex", gap: "4px" }}>
              <Button variant="ghost" size="sm" type="button" disabled={chunkPage <= 1} onClick={() => onSetChunkPage(1)} style={{ padding: "4px" }} title="First Page" aria-label="First chunk page">
                <ChevronsLeft style={{ width: "16px", height: "16px" }} />
              </Button>
              <Button variant="ghost" size="sm" type="button" disabled={chunkPage <= 1} onClick={() => onSetChunkPage((prev) => Math.max(prev - 1, 1))} style={{ padding: "4px" }} title="Previous Page" aria-label="Previous chunk page">
                <ChevronLeft style={{ width: "16px", height: "16px" }} />
              </Button>
              <Button variant="ghost" size="sm" type="button" disabled={chunkPage >= totalChunkPages} onClick={() => onSetChunkPage((prev) => Math.min(prev + 1, totalChunkPages))} style={{ padding: "4px" }} title="Next Page" aria-label="Next chunk page">
                <ChevronRight style={{ width: "16px", height: "16px" }} />
              </Button>
              <Button variant="ghost" size="sm" type="button" disabled={chunkPage >= totalChunkPages} onClick={() => onSetChunkPage(totalChunkPages)} style={{ padding: "4px" }} title="Last Page" aria-label="Last chunk page">
                <ChevronsRight style={{ width: "16px", height: "16px" }} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
