"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Sliders, ChevronDown, ChevronUp } from "lucide-react";

export interface UploadAdvancedSettingsProps {
  showAdvancedSettings: boolean;
  uploadBatchSize: number;
  uploadConcurrentLimit: number;
  uploadMaxRetries: number;
  onSetShowAdvancedSettings: (show: boolean | ((prev: boolean) => boolean)) => void;
  onSetUploadBatchSize: (size: number) => void;
  onSetUploadConcurrentLimit: (limit: number) => void;
  onSetUploadMaxRetries: (retries: number) => void;
}

export default function UploadAdvancedSettings({
  showAdvancedSettings,
  uploadBatchSize,
  uploadConcurrentLimit,
  uploadMaxRetries,
  onSetShowAdvancedSettings,
  onSetUploadBatchSize,
  onSetUploadConcurrentLimit,
  onSetUploadMaxRetries,
}: UploadAdvancedSettingsProps) {
  return (
    <div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onSetShowAdvancedSettings((prev) => !prev)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Sliders style={{ width: "14px", height: "14px", color: "var(--primary)" }} /> Advanced Settings
        </span>
        {showAdvancedSettings ? (
          <ChevronUp style={{ width: "14px", height: "14px" }} />
        ) : (
          <ChevronDown style={{ width: "14px", height: "14px" }} />
        )}
      </Button>

      {showAdvancedSettings && (
        <div
          style={{
            marginTop: "10px",
            padding: "12px 14px",
            background: "var(--background)",
            borderRadius: "var(--radius-md, 8px)",
            border: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <h4
            style={{
              fontSize: "11px",
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--foreground)",
              margin: 0,
            }}
          >
            Batch Settings
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
            <div>
              <label style={{ fontSize: "10.5px", color: "var(--muted-foreground)" }}>
                Batch Size
              </label>
              <Input
                type="number"
                value={uploadBatchSize}
                onChange={(e) => onSetUploadBatchSize(Number(e.target.value))}
                style={{ marginTop: "2px", fontSize: "12px", padding: "7px 10px" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "10.5px", color: "var(--muted-foreground)" }}>
                Concurrent Tasks Limit
              </label>
              <Input
                type="number"
                value={uploadConcurrentLimit}
                onChange={(e) => onSetUploadConcurrentLimit(Number(e.target.value))}
                style={{ marginTop: "2px", fontSize: "12px", padding: "7px 10px" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "10.5px", color: "var(--muted-foreground)" }}>
                Max Retries
              </label>
              <Input
                type="number"
                value={uploadMaxRetries}
                onChange={(e) => onSetUploadMaxRetries(Number(e.target.value))}
                style={{ marginTop: "2px", fontSize: "12px", padding: "7px 10px" }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
