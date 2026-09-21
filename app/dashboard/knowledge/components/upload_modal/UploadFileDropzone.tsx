"use client";

import React, { RefObject } from "react";
import { Input } from "@/components/ui/Input";
import { formatBytes } from "@/lib/utils/formatters";
import { UploadCloud } from "lucide-react";
import {
  ACCEPTED_FILE_EXTENSIONS,
  MAX_FILE_SIZE_LABEL,
} from "./uploadModalLogic";

export interface UploadFileDropzoneProps {
  selectedFile: File | null;
  dragActive: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onSetSelectedFile: (file: File | null) => void;
  onSetDragActive: (active: boolean) => void;
}

export default function UploadFileDropzone({
  selectedFile,
  dragActive,
  fileInputRef,
  onSetSelectedFile,
  onSetDragActive,
}: UploadFileDropzoneProps) {
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        onSetDragActive(true);
      }}
      onDragLeave={() => onSetDragActive(false)}
      onDrop={(e) => {
        e.preventDefault();
        onSetDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          onSetSelectedFile(e.dataTransfer.files[0]);
        }
      }}
      onClick={() => fileInputRef.current?.click()}
      style={{
        border: dragActive ? "2px dashed var(--primary)" : "2px dashed var(--border)",
        borderRadius: "var(--radius-lg, 12px)",
        background: dragActive ? "var(--accent)" : "var(--background)",
        padding: "18px 14px",
        textAlign: "center",
        cursor: "pointer",
        transition: "all 0.2s ease",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "6px",
      }}
    >
      <Input
        type="file"
        ref={fileInputRef}
        accept={ACCEPTED_FILE_EXTENSIONS}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            onSetSelectedFile(e.target.files[0]);
          }
        }}
        style={{ display: "none" }}
      />

      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          background: "var(--primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--primary-foreground)",
        }}
      >
        <UploadCloud style={{ width: "20px", height: "20px" }} />
      </div>

      {selectedFile ? (
        <div>
          <div style={{ fontWeight: "bold", fontSize: "13px", color: "var(--foreground)" }}>
            {selectedFile.name}
          </div>
          <div style={{ fontSize: "11.5px", color: "var(--primary)", fontWeight: "600" }}>
            {formatBytes(selectedFile.size)} - Selected
          </div>
        </div>
      ) : (
        <>
          <div style={{ fontWeight: "bold", fontSize: "13px", color: "var(--foreground)" }}>
            Drop files here or click to select
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "var(--muted-foreground)",
              maxWidth: "380px",
              lineHeight: "1.4",
            }}
          >
            Supported formats: .txt, .md, .markdown, .rst, .adoc, .pdf, .docx, .epub, .xls, .xlsx
          </div>
          <div style={{ fontSize: "10px", color: "var(--muted-foreground)" }}>
            Max file size: {MAX_FILE_SIZE_LABEL}
          </div>
        </>
      )}
    </div>
  );
}
