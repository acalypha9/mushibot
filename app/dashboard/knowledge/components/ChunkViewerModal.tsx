"use client";

import React from "react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Check, Copy } from "lucide-react";
import { ChunkItem } from "../types";

interface ChunkViewerModalProps {
  viewingChunkModal: ChunkItem | null;
  copiedChunkId: string | null;
  onClose: () => void;
  onCopyChunk: (chunk: ChunkItem) => void;
}

export default function ChunkViewerModal({
  viewingChunkModal,
  copiedChunkId,
  onClose,
  onCopyChunk
}: ChunkViewerModalProps) {
  return (
    <Modal
      isOpen={!!viewingChunkModal}
      onClose={onClose}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ padding: "3px 10px", background: "var(--accent)", color: "var(--primary)", borderRadius: "12px", fontSize: "13px", fontWeight: "bold" }}>
            Chunk #{viewingChunkModal?.index}
          </span>
          <span style={{ fontSize: "12px", color: "var(--muted-foreground)", fontFamily: "var(--font-mono)", fontWeight: "normal" }}>
            {viewingChunkModal?.char_count} characters
          </span>
        </div>
      }
      maxWidth="xl"
    >
      {viewingChunkModal && (
        <>
          {/* Full Chunk Text Content Box */}
          <div style={{
            background: "var(--background)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md, 8px)",
            padding: "16px",
            overflowY: "auto",
            maxHeight: "380px",
            fontFamily: "var(--font-mono)",
            fontSize: "13px",
            lineHeight: "1.6",
            color: "var(--foreground)",
            whiteSpace: "pre-wrap"
          }}>
            {viewingChunkModal.content}
          </div>

          {/* Footer Copy & Close Buttons */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCopyChunk(viewingChunkModal)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              {copiedChunkId === viewingChunkModal.id ? <Check style={{ width: "14px", height: "14px", color: "var(--primary)" }} /> : <Copy style={{ width: "14px", height: "14px" }} />}
              {copiedChunkId === viewingChunkModal.id ? "Copied!" : "Copy Text"}
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
