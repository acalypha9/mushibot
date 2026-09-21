"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { Loader2, Database, Plus, Download } from "lucide-react";
import { ModelCapabilityBadges } from "./ModelCapabilityBadges";
import { AvailableModelItem, ConfiguredModel, DownloadProgressInfo } from "../types";
import {
  resolveModelCapabilities,
  buildConfiguredModelFromAvailable
} from "./providerPanelHelpers";

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export interface AvailableModelsSectionProps {
  availableModels: AvailableModelItem[];
  activeTab: "chat" | "embedding" | "parser";
  providerType: string;
  dimensions?: number;
  modelsDevMap: Record<string, unknown>;
  fetchingModels: boolean;
  downloadingModelId: string | null;
  downloadProgress?: Record<string, DownloadProgressInfo>;
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

export function AvailableModelsSection({
  availableModels,
  activeTab,
  providerType,
  dimensions,
  modelsDevMap,
  fetchingModels,
  downloadingModelId,
  downloadProgress = {},
  onDownloadModel,
  onAddConfiguredModel
}: AvailableModelsSectionProps) {
  const isHuggingFace = providerType === "huggingface";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        marginTop: "8px"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "13px", fontWeight: "700", color: "#334155" }}>
          Available Models
        </span>
        <span
          style={{
            fontSize: "11px",
            background: "#f1f5f9",
            color: "#475569",
            padding: "2px 8px",
            borderRadius: "10px",
            fontWeight: "600"
          }}
        >
          {availableModels.length}
        </span>
      </div>

      {fetchingModels ? (
        <div
          style={{
            padding: "24px 16px",
            textAlign: "center",
            color: "#64748b",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px"
          }}
        >
          <Loader2
            style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }}
          />{" "}
          Fetching available models...
        </div>
      ) : availableModels.length === 0 ? (
        <div
          style={{
            padding: "40px 16px",
            textAlign: "center",
            color: "#94a3b8",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px"
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              background: "#f8fafc",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <Database style={{ width: "22px", height: "22px", color: "#94a3b8" }} />
          </div>
          <span style={{ fontSize: "13px" }}>No available models found matching filter</span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {availableModels.map((m, idx) => {
            const caps = resolveModelCapabilities(m);
            const progressInfo = downloadProgress[m.id];
            const isDownloaded = isHuggingFace ? (m.is_downloaded ?? false) : true;
            const isDownloading =
              downloadingModelId === m.id ||
              (progressInfo &&
                (progressInfo.status === "downloading" || progressInfo.status === "starting"));

            return (
              <div
                key={`${m.id}-${idx}`}
                style={{
                  padding: "12px 14px",
                  borderRadius: "8px",
                  border: isDownloading ? "1px solid #93c5fd" : "1px solid #e2e8f0",
                  background: isDownloading ? "#f0f7ff" : "#fafafa",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  transition: "all 0.2s ease"
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "13px", fontWeight: "600", color: "#1e293b" }}>
                        {m.id}
                      </span>
                      {isHuggingFace && (
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: "600",
                            padding: "1px 6px",
                            borderRadius: "8px",
                            background: isDownloaded
                              ? "#dcfce7"
                              : isDownloading
                              ? "#e0f2fe"
                              : "#f1f5f9",
                            color: isDownloaded
                              ? "#15803d"
                              : isDownloading
                              ? "#0284c7"
                              : "#64748b"
                          }}
                        >
                          {isDownloaded
                            ? "Downloaded"
                            : isDownloading
                            ? "Downloading..."
                            : "Not Downloaded"}
                        </span>
                      )}
                    </div>
                    <ModelCapabilityBadges
                      modelId={m.id}
                      hasVision={caps.isVision}
                      hasAudio={caps.isAudio}
                      hasTools={caps.isTools}
                      hasReasoning={caps.isReasoning}
                      contextLength={caps.ctxLen}
                      modelsDevMap={modelsDevMap}
                      category={activeTab}
                      dimensions={dimensions}
                    />
                  </div>

                  <Button
                    type="button"
                    variant={isDownloading ? "ghost" : "primary"}
                    size="sm"
                    disabled={isDownloading}
                    onClick={() => {
                      if (!isDownloaded && isHuggingFace) {
                        onDownloadModel(
                          m.id,
                          m.name,
                          caps.isVision,
                          caps.isAudio,
                          caps.isTools,
                          caps.isReasoning,
                          caps.ctxLen
                        );
                      } else {
                        onAddConfiguredModel(buildConfiguredModelFromAvailable(m));
                      }
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    {isDownloading ? (
                      <>
                        <Loader2
                          style={{
                            width: "13px",
                            height: "13px",
                            animation: "spin 1s linear infinite"
                          }}
                        />
                        <span>
                          {progressInfo?.progress
                            ? `${progressInfo.progress.toFixed(0)}%`
                            : "Downloading..."}
                        </span>
                      </>
                    ) : isDownloaded ? (
                      <>
                        <Plus style={{ width: "13px", height: "13px" }} />
                        <span>Add Model</span>
                      </>
                    ) : (
                      <>
                        <Download style={{ width: "13px", height: "13px" }} />
                        <span>Download</span>
                      </>
                    )}
                  </Button>
                </div>

                {/* REAL-TIME PROGRESS BAR */}
                {isDownloading && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      paddingTop: "6px",
                      borderTop: "1px dashed rgba(59, 130, 246, 0.3)"
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: "11px"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontWeight: "600", color: "#1e40af" }}>
                          {progressInfo?.speed ? `${progressInfo.speed}` : "Downloading..."}
                        </span>
                        {progressInfo &&
                        progressInfo.downloaded_bytes > 0 &&
                        progressInfo.total_bytes > 0 ? (
                          <span style={{ color: "#64748b" }}>
                            ({formatBytes(progressInfo.downloaded_bytes)} /{" "}
                            {formatBytes(progressInfo.total_bytes)})
                          </span>
                        ) : progressInfo?.files_downloaded ? (
                          <span style={{ color: "#64748b" }}>
                            ({progressInfo.files_downloaded} /{" "}
                            {progressInfo.total_files || "?"} files)
                          </span>
                        ) : null}
                      </div>
                      <span
                        style={{
                          fontWeight: "700",
                          color: "#2563eb",
                          fontVariantNumeric: "tabular-nums"
                        }}
                      >
                        {progressInfo ? `${progressInfo.progress.toFixed(1)}%` : "0.0%"}
                      </span>
                    </div>

                    {/* Progress Track */}
                    <div
                      style={{
                        width: "100%",
                        height: "7px",
                        borderRadius: "999px",
                        background: "#dbeafe",
                        overflow: "hidden"
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${Math.max(
                            2,
                            Math.min(100, progressInfo?.progress ?? 0)
                          )}%`,
                          background:
                            "linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)",
                          borderRadius: "999px",
                          transition: "width 0.3s ease-out"
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
