"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { Loader2, Eye, Trash2 } from "lucide-react";
import { ChunkItem } from "../types";

interface DocumentChunksTableProps {
  docChunks: ChunkItem[];
  currentChunksPage: ChunkItem[];
  loadingChunks: boolean;
  onViewChunkModal: (chunk: ChunkItem) => void;
  onDeleteChunk: (chunk: ChunkItem) => void;
}

export default function DocumentChunksTable({
  docChunks,
  currentChunksPage,
  loadingChunks,
  onViewChunkModal,
  onDeleteChunk
}: DocumentChunksTableProps) {
  if (loadingChunks) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
        <Loader2 style={{ width: "20px", height: "20px", animation: "spin 1s linear infinite", display: "inline-block" }} />
        <div style={{ marginTop: "8px" }}>Loading chunks...</div>
      </div>
    );
  }

  if (docChunks.length === 0) {
    return (
      <div style={{ padding: "40px", textAlign: "center", border: "1px dashed #cbd5e1", borderRadius: "12px", color: "#64748b" }}>
        No chunks ingested yet. Click the Eye icon on the table to start ingestion pipeline.
      </div>
    );
  }

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
      <thead>
        <tr style={{ borderBottom: "1px solid var(--border)", color: "#64748b" }}>
          <th style={{ padding: "12px 14px", fontWeight: "700", width: "80px" }}>Index</th>
          <th style={{ padding: "12px 14px", fontWeight: "700" }}>Content</th>
          <th style={{ padding: "12px 14px", fontWeight: "700", width: "130px" }}>Characters</th>
          <th style={{ padding: "12px 14px", fontWeight: "700", textAlign: "right", width: "90px" }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {currentChunksPage.map((chunk) => (
          <tr key={chunk.id} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s ease" }}>
            <td style={{ padding: "12px 14px" }}>
              <span style={{ padding: "3px 10px", background: "#efe5ef", color: "#742774", borderRadius: "12px", fontSize: "12px", fontWeight: "bold" }}>
                #{chunk.index}
              </span>
            </td>

            <td style={{ padding: "12px 14px", color: "#334155", maxWidth: "440px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: "var(--font-mono)", fontSize: "12.5px" }}>
              {chunk.content}
            </td>

            <td style={{ padding: "12px 14px" }}>
              <span style={{ padding: "3px 10px", border: "1px solid #cbd5e1", borderRadius: "14px", fontSize: "11px", color: "#475569", fontFamily: "var(--font-mono)", fontWeight: "600" }}>
                {chunk.char_count} chars
              </span>
            </td>

            <td style={{ padding: "12px 14px", textAlign: "right" }}>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewChunkModal(chunk)}
                  style={{ color: "#742774", padding: "4px" }}
                  title="View Full Chunk"
                  aria-label={`View full chunk #${chunk.index}`}
                >
                  <Eye style={{ width: "16px", height: "16px" }} />
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => onDeleteChunk(chunk)}
                  style={{ padding: "4px" }}
                  title="Delete Chunk"
                  aria-label={`Delete chunk #${chunk.index}`}
                >
                  <Trash2 style={{ width: "16px", height: "16px" }} />
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
