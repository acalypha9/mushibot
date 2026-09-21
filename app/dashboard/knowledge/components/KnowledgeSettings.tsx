"use client";

import React, { FormEvent } from "react";
import Button from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Save } from "lucide-react";
import { Collection, KBSettings } from "../types";
import { sanitizeSettingsNumberInput } from "../knowledgeUtils";

interface KnowledgeSettingsProps {
  selectedCol: Collection | null;
  settings: KBSettings;
  hasUnsavedChanges: boolean;
  isSaved: boolean;
  chunkSizeInput: number | string;
  chunkOverlapInput: number | string;
  parseModelInput: string;
  availableEmbeddingModels: string[];
  onSetChunkSizeInput: (val: number | string) => void;
  onSetChunkOverlapInput: (val: number | string) => void;
  onSetParseModelInput: (val: string) => void;
  onSaveSettings: (e: FormEvent) => Promise<void>;
  onNumberInputChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    min: number,
    max: number,
    setter: (val: number | string) => void
  ) => void;
}

const fieldsetStyle: React.CSSProperties = {
  border: "1px solid #cbd5e1",
  borderRadius: "10px",
  padding: "4px 14px 8px 14px",
  margin: 0
};

const legendStyle: React.CSSProperties = {
  fontSize: "11.5px",
  fontWeight: "600",
  color: "#64748b",
  padding: "0 6px"
};

const numberInputStyle: React.CSSProperties = {
  width: "100%",
  border: "none",
  outline: "none",
  background: "transparent",
  fontSize: "13.5px",
  fontWeight: "bold",
  color: "#0E2440",
  fontFamily: "var(--font-mono)",
  padding: "2px 0"
};

const disabledFieldsetStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  padding: "4px 14px 8px 14px",
  margin: 0,
  background: "#f8fafc",
  opacity: 0.7
};

const disabledSelectStyle: React.CSSProperties = {
  width: "100%",
  border: "none",
  outline: "none",
  background: "transparent",
  fontSize: "13.5px",
  fontWeight: "600",
  color: "#94a3b8",
  cursor: "not-allowed",
  padding: "2px 0"
};

export default function KnowledgeSettings({
  selectedCol,
  settings,
  hasUnsavedChanges,
  isSaved,
  chunkSizeInput,
  chunkOverlapInput,
  parseModelInput,
  availableEmbeddingModels,
  onSetChunkSizeInput,
  onSetChunkOverlapInput,
  onSetParseModelInput,
  onSaveSettings,
  onNumberInputChange
}: KnowledgeSettingsProps) {
  const displayEmbeddingModel = selectedCol?.embedding_model || settings.embedding_model || availableEmbeddingModels[0] || "BAAI/bge-m3";

  return (
    <div style={{
      padding: "28px 32px",
      background: "var(--card)",
      border: "1px solid var(--border)",
      borderRadius: "16px",
      boxShadow: "var(--shadow-sm)",
      display: "flex",
      flexDirection: "column",
      gap: "24px"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "800", color: "#0E2440", margin: 0 }}>
            Knowledge Base Settings
          </h2>
          {hasUnsavedChanges ? (
            <span style={{
              padding: "3px 10px",
              borderRadius: "12px",
              background: "#fef3c7",
              color: "#b45309",
              border: "1px solid #fde68a",
              fontSize: "12px",
              fontWeight: "600",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px"
            }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#d97706" }} />
              Unsaved changes
            </span>
          ) : isSaved ? (
            <span style={{
              padding: "3px 10px",
              borderRadius: "12px",
              background: "#dcfce7",
              color: "#15803d",
              border: "1px solid #bbf7d0",
              fontSize: "12px",
              fontWeight: "600",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px"
            }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#16a34a" }} />
              Saved
            </span>
          ) : null}
        </div>

        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={onSaveSettings}
          disabled={!hasUnsavedChanges}
        >
          <Save style={{ width: "15px", height: "15px" }} /> Save Configuration
        </Button>
      </div>

      <form onSubmit={onSaveSettings} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Basic Settings */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ fontSize: "12.5px", fontWeight: "bold", color: "#334155" }}>
            Basic Settings
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
            {/* Chunk Size */}
            <fieldset style={fieldsetStyle}>
              <legend style={legendStyle}>Chunk Size</legend>
              <Input
                type="number"
                min={1}
                max={4000}
                value={chunkSizeInput}
                onChange={(e) => onNumberInputChange(e, 1, 4000, onSetChunkSizeInput)}
                onBlur={(e) => {
                  const val = sanitizeSettingsNumberInput(chunkSizeInput, 1, 4000, 1);
                  e.target.value = String(val);
                  onSetChunkSizeInput(val);
                }}
                style={numberInputStyle}
              />
            </fieldset>

            {/* Chunk Overlap */}
            <fieldset style={fieldsetStyle}>
              <legend style={legendStyle}>Chunk Overlap</legend>
              <Input
                type="number"
                min={0}
                max={500}
                value={chunkOverlapInput}
                onChange={(e) => onNumberInputChange(e, 0, 500, onSetChunkOverlapInput)}
                onBlur={(e) => {
                  const val = sanitizeSettingsNumberInput(chunkOverlapInput, 0, 500, 0);
                  e.target.value = String(val);
                  onSetChunkOverlapInput(val);
                }}
                style={numberInputStyle}
              />
            </fieldset>
          </div>
        </div>

        {/* Embedding Provider & Parse Model */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ fontSize: "12.5px", fontWeight: "bold", color: "#334155" }}>
            Provider
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
            {/* Embedding Provider Select */}
            <fieldset style={disabledFieldsetStyle}>
              <legend style={{ ...legendStyle, color: "#94a3b8" }}>Embedding Provider</legend>
              <Select disabled value={displayEmbeddingModel} style={disabledSelectStyle}>
                <option value={displayEmbeddingModel}>{displayEmbeddingModel}</option>
              </Select>
            </fieldset>

            {/* Parse Model Select */}
            <fieldset style={disabledFieldsetStyle}>
              <legend style={{ ...legendStyle, color: "#94a3b8" }}>Parser Model</legend>
              <Select
                disabled
                value={parseModelInput}
                onChange={(e) => onSetParseModelInput(e.target.value)}
                style={disabledSelectStyle}
              >
                <option value="LlamaCloud">LlamaCloud</option>
              </Select>
            </fieldset>
          </div>
        </div>
      </form>
    </div>
  );
}
