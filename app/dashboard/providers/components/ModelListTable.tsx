"use client";

import React from "react";
import { ConfiguredModel, TestResult, AvailableModelItem, DownloadProgressInfo } from "../types";
import { ConfiguredModelRow } from "./ConfiguredModelRow";
import { AvailableModelsSection } from "./AvailableModelsSection";

export interface ModelListTableProps {
  activeTab: "chat" | "embedding" | "parser";
  providerType: string;
  dimensions?: number;
  configuredModels: ConfiguredModel[];
  availableModels: AvailableModelItem[];
  modelsDevMap: Record<string, unknown>;
  fetchingModels: boolean;
  downloadingModelId: string | null;
  downloadProgress?: Record<string, DownloadProgressInfo>;
  modelTestResults: Record<string, TestResult>;
  testingModelId: string | null;
  onOpenModelSettings: (model: ConfiguredModel) => void;
  onToggleModelActive: (modelId: string) => void;
  onDeleteConfiguredModel: (modelId: string) => void;
  onTestModel: (modelId: string) => void;
  onDownloadModel: (
    modelId: string,
    modelName?: string,
    isVision?: boolean,
    isAudio?: boolean,
    isTools?: boolean,
    isReasoning?: boolean,
    ctxLen?: string
  ) => void;
  onAddConfiguredModel: (model: ConfiguredModel) => void;
}

export function ModelListTable({
  activeTab,
  providerType,
  dimensions,
  configuredModels,
  availableModels,
  modelsDevMap,
  fetchingModels,
  downloadingModelId,
  downloadProgress,
  modelTestResults,
  testingModelId,
  onOpenModelSettings,
  onToggleModelActive,
  onDeleteConfiguredModel,
  onTestModel,
  onDownloadModel,
  onAddConfiguredModel
}: ModelListTableProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* CONFIGURABLE MODELS LIST */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--foreground)" }}>
            Configured Models
          </span>
          <span
            style={{
              fontSize: "11px",
              background: "var(--accent)",
              color: "var(--primary)",
              padding: "2px 8px",
              borderRadius: "10px",
              fontWeight: "600"
            }}
          >
            {configuredModels.length}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {configuredModels.map((model, idx) => (
            <ConfiguredModelRow
              key={`${model.id}-${idx}`}
              model={model}
              index={idx}
              activeTab={activeTab}
              dimensions={dimensions}
              modelsDevMap={modelsDevMap}
              testResult={modelTestResults[model.id]}
              isTesting={testingModelId === model.id}
              onOpenModelSettings={onOpenModelSettings}
              onToggleModelActive={onToggleModelActive}
              onDeleteConfiguredModel={onDeleteConfiguredModel}
              onTestModel={onTestModel}
            />
          ))}
        </div>
      </div>

      {/* AVAILABLE MODELS SECTION */}
      {(availableModels.length > 0 || fetchingModels) && (
        <AvailableModelsSection
          availableModels={availableModels}
          activeTab={activeTab}
          providerType={providerType}
          dimensions={dimensions}
          modelsDevMap={modelsDevMap}
          fetchingModels={fetchingModels}
          downloadingModelId={downloadingModelId}
          downloadProgress={downloadProgress}
          onDownloadModel={onDownloadModel}
          onAddConfiguredModel={onAddConfiguredModel}
        />
      )}
    </div>
  );
}
