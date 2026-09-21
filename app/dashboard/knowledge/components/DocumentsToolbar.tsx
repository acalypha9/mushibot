"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { Upload } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Search, X } from "lucide-react";

interface DocumentsToolbarProps {
  hasNoEmbeddingModel: boolean;
  onOpenUploadModal: () => void;
  docSearchInput: string;
  onDocSearchInputChange: (val: string) => void;
  onDocSearchSubmit: (val: string) => void;
  onClearDocSearch: () => void;
  onSetCurrentPage: (page: number | ((prev: number) => number)) => void;
}

export default function DocumentsToolbar({
  hasNoEmbeddingModel,
  onOpenUploadModal,
  docSearchInput,
  onDocSearchInputChange,
  onDocSearchSubmit,
  onClearDocSearch,
  onSetCurrentPage
}: DocumentsToolbarProps) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
      <Button
        variant="primary"
        size="md"
        disabled={hasNoEmbeddingModel}
        onClick={() => {
          if (!hasNoEmbeddingModel) onOpenUploadModal();
        }}
        title={
          hasNoEmbeddingModel
            ? "Embedding model is not configured. Please set up an embedding model in Dashboard > Providers."
            : undefined
        }
      >
        <Upload style={{ width: "14px", height: "14px" }} /> Upload Document
      </Button>

      <div style={{ position: "relative", width: "240px" }}>
        <Search
          style={{
            position: "absolute",
            left: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            width: "14px",
            height: "14px",
            color: "#605e5c",
            zIndex: 1
          }}
        />
        <Input
          type="text"
          placeholder="Search documents..."
          value={docSearchInput}
          onChange={(e) => {
            onDocSearchInputChange(e.target.value);
            if (!e.target.value) {
              onDocSearchSubmit("");
              onSetCurrentPage(1);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onDocSearchSubmit(docSearchInput.trim());
              onSetCurrentPage(1);
            }
          }}
          style={{ paddingLeft: "34px", paddingRight: "28px" }}
          aria-label="Search documents"
        />
        {docSearchInput && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearDocSearch}
            style={{
              position: "absolute",
              right: "8px",
              top: "50%",
              transform: "translateY(-50%)",
              padding: 0,
              height: "auto",
              minHeight: "unset"
            }}
            title="Clear search"
            aria-label="Clear search"
          >
            <X style={{ width: "14px", height: "14px" }} />
          </Button>
        )}
      </div>
    </div>
  );
}
