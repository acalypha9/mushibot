"use client";

import React from "react";
import { Select } from "@/components/ui/Input";

interface EmbeddingSettingsSectionProps {
  modelExecutionDevice: string;
  setModelExecutionDevice: (val: string) => void;
  modelNormalizeEmbeddings: boolean;
  setModelNormalizeEmbeddings: (val: boolean) => void;
}

export function EmbeddingSettingsSection({
  modelExecutionDevice,
  setModelExecutionDevice,
  modelNormalizeEmbeddings,
  setModelNormalizeEmbeddings
}: EmbeddingSettingsSectionProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <label style={{ fontSize: "12px", fontWeight: "600", color: "#334155" }}>
          Model Kwargs (Execution Device)
        </label>
        <Select
          value={modelExecutionDevice}
          onChange={(e) => setModelExecutionDevice(e.target.value)}
          style={{
            fontSize: "13px",
            width: "100%"
          }}
        >
          <option value="gpu">GPU</option>
          <option value="cpu">CPU</option>
        </Select>
        <span style={{ fontSize: "11px", color: "#94a3b8" }}>
          Target execution device passed to model_kwargs.
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <label style={{ fontSize: "12px", fontWeight: "600", color: "#334155" }}>
          Encode Kwargs (Normalize Embeddings)
        </label>
        <Select
          value={modelNormalizeEmbeddings ? "true" : "false"}
          onChange={(e) => setModelNormalizeEmbeddings(e.target.value === "true")}
          style={{
            fontSize: "13px",
            width: "100%"
          }}
        >
          <option value="true">Enabled</option>
          <option value="false">Disabled</option>
        </Select>
        <span style={{ fontSize: "11px", color: "#94a3b8" }}>
          Passed to encode_kwargs. Normalizing vector embeddings to unit length is recommended
          for cosine similarity vector search.
        </span>
      </div>
    </div>
  );
}
