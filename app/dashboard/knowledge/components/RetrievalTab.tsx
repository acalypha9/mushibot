"use client";

import React, { FormEvent } from "react";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Search, Loader2, Info, AlertCircle } from "lucide-react";
import { Collection, DocumentItem, RetrievalItem } from "../types";

interface RetrievalTabProps {
  selectedCol: Collection;
  documents: DocumentItem[];
  hasNoEmbeddingModel: boolean;
  retrievalQuery: string;
  retrievalTopK: number | string;
  retrievalLoading: boolean;
  retrievalResults: RetrievalItem[];
  showRetrievalTooltip: boolean;
  onSetRetrievalQuery: (query: string) => void;
  onSetRetrievalTopK: (topK: number | string) => void;
  onSetShowRetrievalTooltip: (show: boolean) => void;
  onTestRetrieval: (e: FormEvent) => Promise<void>;
  onNumberInputChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    min: number,
    max: number,
    setter: (val: number | string) => void
  ) => void;
}

export default function RetrievalTab({
  selectedCol,
  documents,
  hasNoEmbeddingModel,
  retrievalQuery,
  retrievalTopK,
  retrievalLoading,
  retrievalResults,
  showRetrievalTooltip,
  onSetRetrievalQuery,
  onSetRetrievalTopK,
  onSetShowRetrievalTooltip,
  onTestRetrieval,
  onNumberInputChange
}: RetrievalTabProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
      {hasNoEmbeddingModel ? (
        <div style={{
          border: "1px solid #fde68a",
          padding: "12px 16px",
          borderRadius: "8px",
          background: "#fffbeb",
          color: "#b45309",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          fontSize: "13px"
        }}>
          <AlertCircle style={{ width: "18px", height: "18px", flexShrink: 0 }} />
          <span>Embedding model is not configured. Please set up an embedding model in <strong>Dashboard &gt; Providers</strong> to enable retrieval search testing.</span>
        </div>
      ) : documents.length === 0 ? (
        <div style={{
          border: "1px solid #cbd5e1",
          padding: "12px 16px",
          borderRadius: "8px",
          background: "#f8fafc",
          color: "#64748b",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          fontSize: "13px"
        }}>
          <AlertCircle style={{ width: "18px", height: "18px", flexShrink: 0, color: "#94a3b8" }} />
          <span>No documents uploaded in this collection. Please upload a document in the <strong>Documents</strong> tab first to test retrieval search.</span>
        </div>
      ) : null}

      <div style={{ padding: "24px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }}>
        <h3 style={{ fontSize: "15px", fontWeight: "bold", marginBottom: "6px" }}>
          Retrieval
        </h3>
        <div style={{ fontSize: "13px", color: "var(--muted-foreground)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span>
            Test real-time semantic similarity retrieval against collection <strong style={{ fontFamily: "var(--font-mono)", color: "var(--secondary)" }}>{selectedCol.name}</strong>.
          </span>
          <span
            style={{ position: "relative", display: "inline-flex", alignItems: "center", cursor: "pointer" }}
            onClick={() => onSetShowRetrievalTooltip(!showRetrievalTooltip)}
            onMouseEnter={() => onSetShowRetrievalTooltip(true)}
            onMouseLeave={() => onSetShowRetrievalTooltip(false)}
          >
            <Info style={{ width: "15px", height: "15px", color: "#742774" }} />
            {showRetrievalTooltip && (
              <div style={{
                position: "absolute",
                bottom: "calc(100% + 8px)",
                left: "50%",
                transform: "translateX(-50%)",
                background: "#0E2440",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: "500",
                padding: "7px 12px",
                borderRadius: "8px",
                whiteSpace: "nowrap",
                boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
                zIndex: 100,
                pointerEvents: "none"
              }}>
                A lower distance score number indicates higher semantic similarity (smaller number is better).
                <div style={{
                  position: "absolute",
                  top: "100%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 0,
                  height: 0,
                  borderLeft: "6px solid transparent",
                  borderRight: "6px solid transparent",
                  borderTop: "6px solid #0E2440"
                }} />
              </div>
            )}
          </span>
        </div>

        <form onSubmit={onTestRetrieval} style={{ display: "flex", gap: "12px", flexWrap: "wrap", opacity: (hasNoEmbeddingModel || documents.length === 0) ? 0.5 : 1 }}>
          <Input
            required
            disabled={hasNoEmbeddingModel || documents.length === 0}
            type="text"
            placeholder={
              hasNoEmbeddingModel
                ? "Embedding provider not configured. Set up model in Providers first..."
                : documents.length === 0
                ? "Upload a document first to enable retrieval testing..."
                : "Type a test question or search query..."
            }
            value={retrievalQuery}
            onChange={(e) => onSetRetrievalQuery(e.target.value)}
            style={{ flex: 1, minWidth: "260px", cursor: (hasNoEmbeddingModel || documents.length === 0) ? "not-allowed" : "text" }}
          />
          {(() => {
            const totalColChunks = Math.max(1, documents.reduce((acc, d) => acc + (d.chunk_count || 0), 0) || selectedCol?.chunk_count || 1);
            return (
              <div style={{ display: "inline-flex", alignItems: "center", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "var(--muted)", padding: "0 12px", opacity: (hasNoEmbeddingModel || documents.length === 0) ? 0.6 : 1 }}>
                <Input
                  disabled={hasNoEmbeddingModel || documents.length === 0}
                  type="number"
                  min={1}
                  max={totalColChunks}
                  value={retrievalTopK}
                  onChange={(e) => onNumberInputChange(e, 1, totalColChunks, onSetRetrievalTopK)}
                  onBlur={(e) => {
                    if (!retrievalTopK || Number(retrievalTopK) < 1) {
                      e.target.value = "1";
                      onSetRetrievalTopK(1);
                    } else if (Number(retrievalTopK) > totalColChunks) {
                      e.target.value = totalColChunks.toString();
                      onSetRetrievalTopK(totalColChunks);
                    }
                  }}
                  style={{
                    width: "50px",
                    padding: "8px 0",
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    fontSize: "13px",
                    fontWeight: "bold",
                    color: "var(--foreground)",
                    textAlign: "center",
                    cursor: (hasNoEmbeddingModel || documents.length === 0) ? "not-allowed" : "text"
                  }}
                />
                <span style={{ fontSize: "13px", fontWeight: "500", color: "var(--muted-foreground)", marginLeft: "4px" }}>Chunks</span>
              </div>
            );
          })()}
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={retrievalLoading || hasNoEmbeddingModel || documents.length === 0}
          >
            {retrievalLoading ? <Loader2 style={{ width: "14px", height: "14px", animation: "spin 1s linear infinite" }} /> : <Search style={{ width: "14px", height: "14px" }} />}
            Search
          </Button>
        </form>
      </div>

      {/* Search Results */}
      {retrievalResults.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <h4 style={{ fontSize: "13px", fontWeight: "bold", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
            Matching Vector Chunks ({retrievalResults.length})
          </h4>
          {retrievalResults.map((item, idx) => (
            <div key={idx} style={{ padding: "16px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: "bold", fontSize: "13px", color: "var(--secondary)" }}>
                  #{idx + 1} {typeof item.metadata?.title === "string" ? item.metadata.title : "Chunk"}
                </span>
                <span
                  title="A lower distance score number indicates higher semantic similarity (smaller number is better)."
                  style={{ fontSize: "11px", padding: "2px 8px", background: "var(--muted)", borderRadius: "10px", fontFamily: "var(--font-mono)", display: "inline-flex", alignItems: "center", gap: "4px", cursor: "pointer" }}
                >
                  Distance Score: {item.score}
                  <Info style={{ width: "11px", height: "11px", color: "#742774" }} />
                </span>
              </div>
              <p style={{ fontSize: "13px", background: "var(--muted)", padding: "12px", borderRadius: "var(--radius-sm)", whiteSpace: "pre-wrap", fontFamily: "var(--font-mono)", lineHeight: "1.5" }}>
                {item.page_content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
