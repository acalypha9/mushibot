"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Loader2,
  Plug,
  Settings,
  Trash2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { ModelCapabilityBadges } from "./ModelCapabilityBadges";
import { ConfiguredModel, TestResult } from "../types";
import { cleanRawModelId } from "../metadata";

export interface ConfiguredModelRowProps {
  model: ConfiguredModel;
  index: number;
  activeTab: "chat" | "embedding" | "parser";
  dimensions?: number;
  modelsDevMap: Record<string, unknown>;
  testResult?: TestResult;
  isTesting: boolean;
  onOpenModelSettings: (model: ConfiguredModel) => void;
  onToggleModelActive: (modelId: string) => void;
  onDeleteConfiguredModel: (modelId: string) => void;
  onTestModel: (modelId: string) => void;
}

export function ConfiguredModelRow({
  model,
  index,
  activeTab,
  dimensions,
  modelsDevMap,
  testResult,
  isTesting,
  onOpenModelSettings,
  onToggleModelActive,
  onDeleteConfiguredModel,
  onTestModel
}: ConfiguredModelRowProps) {
  const cleanId = cleanRawModelId(model.id);

  return (
    <div
      key={`${model.id}-${index}`}
      style={{
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "12px 16px",
        background: "var(--card)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontWeight: "700", fontSize: "14px", color: "var(--foreground)" }}>
            {cleanId}
          </span>
          {testResult && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "11px",
                fontWeight: "600",
                padding: "2px 8px",
                borderRadius: "12px",
                background: testResult.status === "success" ? "#dcfce7" : "#fee2e2",
                color: testResult.status === "success" ? "#15803d" : "#b91c1c",
                border: testResult.status === "success" ? "1px solid #bbf7d0" : "1px solid #fca5a5"
              }}
            >
              {testResult.status === "success" ? (
                <CheckCircle2 style={{ width: "12px", height: "12px" }} />
              ) : (
                <AlertCircle style={{ width: "12px", height: "12px" }} />
              )}
              {testResult.message}
            </span>
          )}
        </div>
        <span style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>{cleanId}</span>

        <ModelCapabilityBadges
          modelId={cleanId}
          hasVision={model.has_vision}
          hasAudio={model.has_audio}
          hasTools={model.has_tools}
          hasReasoning={
            model.has_reasoning ??
            (model.id.toLowerCase().includes("r1") ||
              model.id.toLowerCase().includes("deepseek") ||
              model.id.toLowerCase().includes("o1") ||
              model.id.toLowerCase().includes("o3") ||
              model.id.toLowerCase().includes("fable") ||
              model.id.toLowerCase().includes("opus") ||
              model.id.toLowerCase().includes("haiku"))
          }
          contextLength={model.context_length}
          modelsDevMap={modelsDevMap}
          category={activeTab}
          dimensions={dimensions}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <label
          style={{
            position: "relative",
            display: "inline-block",
            width: "42px",
            height: "22px",
            cursor: "pointer"
          }}
        >
          <Input
            type="checkbox"
            checked={model.is_active}
            onChange={() => onToggleModelActive(model.id)}
            style={{ opacity: 0, width: 0, height: 0 }}
          />
          <span
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: model.is_active ? "var(--primary)" : "var(--border)",
              transition: ".2s",
              borderRadius: "22px"
            }}
          >
            <span
              style={{
                position: "absolute",
                content: '""',
                height: "16px",
                width: "16px",
                left: model.is_active ? "22px" : "3px",
                bottom: "3px",
                backgroundColor: "white",
                transition: ".2s",
                borderRadius: "50%"
              }}
            />
          </span>
        </label>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onTestModel(model.id)}
          disabled={isTesting}
          style={{ color: "var(--muted-foreground)", padding: "4px" }}
          title="Test model connectivity"
        >
          {isTesting ? (
            <Loader2
              style={{
                width: "16px",
                height: "16px",
                color: "var(--primary)",
                animation: "spin 1s linear infinite"
              }}
            />
          ) : (
            <Plug style={{ width: "16px", height: "16px" }} />
          )}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onOpenModelSettings(model)}
          style={{ color: "var(--muted-foreground)", padding: "4px" }}
          title="Model Settings"
        >
          <Settings style={{ width: "16px", height: "16px" }} />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onDeleteConfiguredModel(model.id)}
          style={{ color: "var(--muted-foreground)", padding: "4px" }}
          title="Delete model"
        >
          <Trash2 style={{ width: "16px", height: "16px" }} />
        </Button>
      </div>
    </div>
  );
}
