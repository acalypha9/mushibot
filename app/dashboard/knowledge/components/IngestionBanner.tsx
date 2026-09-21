"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { Loader2 } from "lucide-react";
import { DocumentItem } from "../types";
import { getIngestionStepLabel } from "./documentsLogic";

interface IngestionBannerProps {
  ingestingDoc: DocumentItem | null;
  ingestProgress: number;
  ingestStep: string;
  onCancelIngestion: () => void;
}

export default function IngestionBanner({
  ingestingDoc,
  ingestProgress,
  ingestStep,
  onCancelIngestion
}: IngestionBannerProps) {
  if (!ingestingDoc) return null;

  return (
    <div
      style={{
        background: "var(--card)",
        border: "1.5px solid #742774",
        borderRadius: "16px",
        padding: "18px 24px",
        boxShadow: "0 8px 25px -5px rgba(116, 39, 116, 0.15)",
        display: "flex",
        flexDirection: "column",
        gap: "12px"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "#efe5ef",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#742774"
            }}
          >
            <Loader2 className="animate-spin" style={{ width: "20px", height: "20px" }} />
          </div>
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: "800", color: "#0E2440", margin: 0 }}>
              Ingesting Document
            </h3>
            <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
              {ingestingDoc.title}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px", fontWeight: "bold" }}>
          <span style={{ color: "#742774" }}>{ingestStep}</span>
          <span style={{ color: "#0E2440", fontFamily: "var(--font-mono)", fontSize: "13px" }}>
            {ingestProgress}%
          </span>
        </div>
      </div>

      <div
        style={{
          width: "100%",
          height: "8px",
          background: "#e2e8f0",
          borderRadius: "8px",
          overflow: "hidden",
          position: "relative"
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${ingestProgress}%`,
            background: "#742774",
            borderRadius: "8px",
            transition: "width 0.3s ease"
          }}
        />
      </div>

      <div
        style={{
          fontSize: "11px",
          color: "#94a3b8",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <span>{getIngestionStepLabel(ingestingDoc)}</span>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span>Processing...</span>
          <Button variant="danger" size="sm" onClick={onCancelIngestion}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
