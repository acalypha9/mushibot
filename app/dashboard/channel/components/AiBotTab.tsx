"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Save, ChevronDown } from "lucide-react";
import { ModelOptionItem, formatModelLabel } from "../types";

interface AiBotTabProps {
  onSaveAllConfig: (e?: React.FormEvent) => void;
  hasUnsavedBotChanges: boolean;
  isSaved: boolean;
  cfgAutoReply: boolean;
  setCfgAutoReply: (val: boolean) => void;
  cfgModel: string;
  setCfgModel: (model: string) => void;
  defaultModelName: string;
  configuredModelsList: ModelOptionItem[];
  cfgRetrievalK: number;
  setCfgRetrievalK: (k: number) => void;
  cfgSystemPrompt: string;
  setCfgSystemPrompt: (prompt: string) => void;
}

export default function AiBotTab({
  onSaveAllConfig,
  hasUnsavedBotChanges,
  isSaved,
  cfgAutoReply,
  setCfgAutoReply,
  cfgModel,
  setCfgModel,
  defaultModelName,
  configuredModelsList,
  cfgRetrievalK,
  setCfgRetrievalK,
  cfgSystemPrompt,
  setCfgSystemPrompt,
}: AiBotTabProps) {
  return (
    <form
      onSubmit={onSaveAllConfig}
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "18px",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid var(--border)",
          paddingBottom: "16px",
          marginBottom: "4px",
          minHeight: "42px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <h2
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              margin: 0,
              color: "var(--foreground)",
            }}
          >
            AI Mode & System Persona
          </h2>
          {hasUnsavedBotChanges ? (
            <span
              style={{
                padding: "3px 10px",
                borderRadius: "12px",
                background: "#fef3c7",
                color: "#b45309",
                border: "1px solid #fde68a",
                fontSize: "12px",
                fontWeight: "600",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#d97706" }} />
              Unsaved changes
            </span>
          ) : isSaved ? (
            <span
              style={{
                padding: "3px 10px",
                borderRadius: "12px",
                background: "#dcfce7",
                color: "#15803d",
                border: "1px solid #bbf7d0",
                fontSize: "12px",
                fontWeight: "600",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#16a34a" }} />
              Saved
            </span>
          ) : null}
        </div>

        <Button
          type="submit"
          variant={hasUnsavedBotChanges ? "primary" : "ghost"}
          size="md"
        >
          <Save
            style={{
              width: "15px",
              height: "15px",
              color: hasUnsavedBotChanges ? "#ffffff" : "var(--primary)",
            }}
          />
          <span>Save Configuration</span>
        </Button>
      </div>

      <div>
        <label style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
          AI Reply Bot Mode
        </label>
        <div style={{ position: "relative", marginTop: "4px" }}>
          <Select
            value={cfgAutoReply ? "enabled" : "disabled"}
            onChange={(e) => setCfgAutoReply(e.target.value === "enabled")}
          >
            <option value="enabled">Enabled</option>
            <option value="disabled">Disabled</option>
          </Select>
          <ChevronDown
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "16px",
              height: "16px",
              color: "var(--muted-foreground)",
              pointerEvents: "none",
            }}
          />
        </div>
      </div>

      <div>
        <label style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
          AI Model Provider
        </label>
        <div style={{ position: "relative", marginTop: "4px" }}>
          <Select
            value={cfgModel}
            onChange={(e) => setCfgModel(e.target.value)}
          >
            <option value="">{defaultModelName ? `Default (${defaultModelName})` : "Select AI Model Provider"}</option>
            {configuredModelsList.map((m, idx) => (
              <option key={`${m.id}-${idx}`} value={m.id}>
                {formatModelLabel(m)}
              </option>
            ))}
          </Select>
          <ChevronDown
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "16px",
              height: "16px",
              color: "var(--muted-foreground)",
              pointerEvents: "none",
            }}
          />
        </div>
        <span style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>
          Choose a specific AI model for this channel, or use the global default chat model provider.
        </span>
      </div>

      <div>
        <label style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
          Top K Chunks
        </label>
        <Input
          type="number"
          min={1}
          max={50}
          value={cfgRetrievalK}
          onChange={(e) => setCfgRetrievalK(Math.max(1, Math.min(50, Number(e.target.value))))}
        />
        <span style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>
          Set the number of document chunks (k) to retrieve from the knowledge base during vector search (default 3, max 50).
        </span>
      </div>

      <div>
        <label style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
          Custom System Persona Prompt
        </label>
        <Textarea
          rows={5}
          placeholder="You are a helpful agent. Always greet users politely and answer questions clearly..."
          value={cfgSystemPrompt}
          onChange={(e) => setCfgSystemPrompt(e.target.value)}
        />
        <span style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>Custom system prompt override for this channel</span>
      </div>
    </form>
  );
}
