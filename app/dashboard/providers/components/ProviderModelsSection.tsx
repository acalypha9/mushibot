"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Search, Download, Wand2, X, Loader2 } from "lucide-react";
import { ConfiguredModel, TestResult, AvailableModelItem, DownloadProgressInfo } from "../types";
import { ModelListTable } from "./ModelListTable";
import {
  filterModelsBySearch,
  toggleConfiguredModelActive,
  removeConfiguredModelById
} from "./providerPanelHelpers";

export interface ProviderModelsSectionProps {
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
  onFetchModelList: () => void;
  onOpenCustomModelModal: () => void;
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
  updateConfiguredModels: (
    updater: (prevModels: ConfiguredModel[]) => ConfiguredModel[]
  ) => void;
}

export function ProviderModelsSection({
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
  onFetchModelList,
  onOpenCustomModelModal,
  onOpenModelSettings,
  onToggleModelActive,
  onDeleteConfiguredModel,
  onTestModel,
  onDownloadModel,
  updateConfiguredModels
}: ProviderModelsSectionProps) {
  const [modelSearchInput, setModelSearchInput] = useState("");
  const [modelSearch, setModelSearch] = useState("");

  const filteredConfigured = filterModelsBySearch(configuredModels, modelSearch);
  const filteredAvailable = filterModelsBySearch(availableModels, modelSearch);

  return (
    <div
      style={{
        borderTop: "1px solid var(--border)",
        paddingTop: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "18px"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "700",
              color: "var(--foreground)",
              margin: 0
            }}
          >
            Models
          </h3>
          <span style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>
            Available Models {availableModels.length}
          </span>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <Search
              style={{
                position: "absolute",
                left: "10px",
                width: "14px",
                height: "14px",
                color: "var(--muted-foreground)"
              }}
            />
            <Input
              type="text"
              placeholder="Search models..."
              value={modelSearchInput}
              onChange={(e) => {
                setModelSearchInput(e.target.value);
                if (!e.target.value) setModelSearch("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  setModelSearch(modelSearchInput.trim());
                }
              }}
              style={{
                paddingLeft: "32px",
                paddingRight: "28px",
                paddingTop: "6px",
                paddingBottom: "6px",
                borderRadius: "20px",
                fontSize: "12px",
                width: "180px"
              }}
            />
            {modelSearchInput && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setModelSearchInput("");
                  setModelSearch("");
                }}
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--muted-foreground)",
                  padding: 0
                }}
              >
                <X style={{ width: "12px", height: "12px" }} />
              </Button>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onFetchModelList}
            disabled={fetchingModels}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              borderRadius: "20px"
            }}
          >
            {fetchingModels ? (
              <Loader2
                style={{ width: "14px", height: "14px", animation: "spin 1s linear infinite" }}
              />
            ) : (
              <Download style={{ width: "14px", height: "14px" }} />
            )}
            Fetch Model List
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onOpenCustomModelModal}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "var(--primary)"
            }}
          >
            <Wand2 style={{ width: "14px", height: "14px" }} /> Custom Model
          </Button>
        </div>
      </div>

      <ModelListTable
        activeTab={activeTab}
        providerType={providerType}
        dimensions={dimensions}
        configuredModels={filteredConfigured}
        availableModels={filteredAvailable}
        modelsDevMap={modelsDevMap}
        fetchingModels={fetchingModels}
        downloadingModelId={downloadingModelId}
        downloadProgress={downloadProgress}
        modelTestResults={modelTestResults}
        testingModelId={testingModelId}
        onOpenModelSettings={onOpenModelSettings}
        onToggleModelActive={(modelId) => {
          if (onToggleModelActive) {
            onToggleModelActive(modelId);
          } else {
            updateConfiguredModels((prev) => toggleConfiguredModelActive(prev, modelId));
          }
        }}
        onDeleteConfiguredModel={(modelId) => {
          if (onDeleteConfiguredModel) {
            onDeleteConfiguredModel(modelId);
          } else {
            updateConfiguredModels((prev) => removeConfiguredModelById(prev, modelId));
          }
        }}
        onTestModel={onTestModel}
        onDownloadModel={onDownloadModel}
        onAddConfiguredModel={(newModel) => {
          updateConfiguredModels((prev) => [
            ...prev.filter((cm) => cm.id !== newModel.id),
            newModel
          ]);
        }}
      />
    </div>
  );
}
