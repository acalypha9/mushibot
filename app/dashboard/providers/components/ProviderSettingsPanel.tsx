"use client";

import React from "react";
import { Cpu } from "lucide-react";
import {
  ConfiguredModel,
  ModelProvider,
  ProviderFormData,
  PROVIDER_PRESETS,
  TestResult,
  AvailableModelItem,
  DownloadProgressInfo
} from "../types";
import { ProviderHeaderRow } from "./ProviderHeaderRow";
import { ProviderCredentialsSection } from "./ProviderCredentialsSection";
import { ModelParametersForm } from "./ModelParametersForm";
import { ProviderModelsSection } from "./ProviderModelsSection";

export interface ProviderSettingsPanelProps {
  selectedProvider: ModelProvider | null;
  formData: ProviderFormData;
  updateFormData: (
    updater: Partial<ProviderFormData> | ((prev: ProviderFormData) => ProviderFormData)
  ) => void;
  activeTab: "chat" | "embedding" | "parser";
  hasUnsavedChanges: boolean;
  isSaved: boolean;
  saving: boolean;
  onSave: (e?: React.FormEvent) => void;
  onOpenApiKeyModal: () => void;
  modelsDevMap: Record<string, unknown>;
  availableModels: AvailableModelItem[];
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
}

function ProviderEmptyState({ activeTab }: { activeTab: string }) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: "12px",
        background: "var(--card)",
        padding: "24px",
        display: "flex",
        flexDirection: "column"
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          minHeight: "440px",
          color: "var(--muted-foreground)",
          textAlign: "center",
          gap: "14px"
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "var(--muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <Cpu style={{ width: "28px", height: "28px", opacity: 0.5 }} />
        </div>
        <h3 style={{ fontSize: "16px", fontWeight: "600", color: "var(--foreground)" }}>
          No provider source selected
        </h3>
        <p style={{ fontSize: "13px", maxWidth: "340px" }}>
          Select a provider source from the left sidebar or click <strong>+ Add</strong> to
          configure a new provider for <strong>{activeTab.toUpperCase()}</strong>.
        </p>
      </div>
    </div>
  );
}

export function ProviderSettingsPanel({
  selectedProvider,
  formData,
  updateFormData,
  activeTab,
  hasUnsavedChanges,
  isSaved,
  saving,
  onSave,
  onOpenApiKeyModal,
  modelsDevMap,
  availableModels,
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
  onDownloadModel
}: ProviderSettingsPanelProps) {
  if (!selectedProvider) {
    return <ProviderEmptyState activeTab={activeTab} />;
  }

  const fallbackBaseUrl =
    formData.base_url ||
    PROVIDER_PRESETS.find(
      (p) => p.type === (formData.provider_type || selectedProvider.provider_type)
    )?.defaultBaseUrl ||
    "https://api.openai.com/v1";

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: "12px",
        background: "var(--card)",
        padding: "24px",
        display: "flex",
        flexDirection: "column"
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
        <ProviderHeaderRow
          providerName={selectedProvider.name || formData.name || "openai"}
          hasUnsavedChanges={hasUnsavedChanges}
          isSaved={isSaved}
          saving={saving}
          baseUrl={fallbackBaseUrl}
          onSave={onSave}
        />

        {/* SETTINGS SECTION */}
        <ProviderCredentialsSection
          selectedProvider={selectedProvider}
          formData={formData}
          updateFormData={updateFormData}
          onOpenApiKeyModal={onOpenApiKeyModal}
        />

        {/* ADVANCED CONFIGURATION... SECTION */}
        <ModelParametersForm
          formData={formData}
          updateFormData={updateFormData}
        />

        {/* MODELS SECTION */}
        <ProviderModelsSection
          activeTab={activeTab}
          providerType={formData.provider_type || selectedProvider.provider_type}
          dimensions={(formData as unknown as { dimensions?: number }).dimensions}
          configuredModels={formData.configured_models}
          availableModels={availableModels}
          modelsDevMap={modelsDevMap}
          fetchingModels={fetchingModels}
          downloadingModelId={downloadingModelId}
          downloadProgress={downloadProgress}
          modelTestResults={modelTestResults}
          testingModelId={testingModelId}
          onFetchModelList={onFetchModelList}
          onOpenCustomModelModal={onOpenCustomModelModal}
          onOpenModelSettings={onOpenModelSettings}
          onToggleModelActive={onToggleModelActive}
          onDeleteConfiguredModel={onDeleteConfiguredModel}
          onTestModel={onTestModel}
          onDownloadModel={onDownloadModel}
          updateConfiguredModels={(updater) => {
            updateFormData((prev) => ({
              ...prev,
              configured_models: updater(prev.configured_models)
            }));
          }}
        />
      </div>
    </div>
  );
}
