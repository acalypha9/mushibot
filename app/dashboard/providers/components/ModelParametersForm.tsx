"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ProviderFormData } from "../types";

export interface ModelParametersFormProps {
  formData: ProviderFormData;
  updateFormData: (
    updater: Partial<ProviderFormData> | ((prev: ProviderFormData) => ProviderFormData)
  ) => void;
}

export function ModelParametersForm({
  formData,
  updateFormData
}: ModelParametersFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(true);

  return (
    <div
      style={{
        borderTop: "1px solid var(--border)",
        paddingTop: "18px",
        display: "flex",
        flexDirection: "column",
        gap: "16px"
      }}
    >
      <Button
        type="button"
        variant="ghost"
        onClick={() => setShowAdvanced(!showAdvanced)}
        style={{
          padding: 0,
          fontSize: "15px",
          fontWeight: "700",
          color: "var(--foreground)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%"
        }}
      >
        <span>Advanced Configuration...</span>
        {showAdvanced ? (
          <ChevronUp style={{ width: "16px", height: "16px" }} />
        ) : (
          <ChevronDown style={{ width: "16px", height: "16px" }} />
        )}
      </Button>

      {showAdvanced && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* TIMEOUT */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: "600", color: "var(--foreground)" }}>
              Timeout
            </label>
            <Input
              type="number"
              value={formData.timeout}
              onChange={(e) =>
                updateFormData({ timeout: parseInt(e.target.value, 10) || 120 })
              }
            />
            <span style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>
              Timeout in seconds.
            </span>
          </div>

          {/* PROXY */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: "600", color: "var(--foreground)" }}>
              Proxy
            </label>
            <Input
              type="text"
              value={formData.proxy}
              onChange={(e) => updateFormData({ proxy: e.target.value })}
              placeholder="http://127.0.0.1:7890"
            />
            <span
              style={{
                fontSize: "11px",
                color: "var(--muted-foreground)",
                lineHeight: "1.4"
              }}
            >
              HTTP/HTTPS proxy address (http://127.0.0.1:7890). Only affects this provider&apos;s
              API requests, doesn&apos;t interfere with Docker internal networking.
            </span>
          </div>

          {/* CUSTOM REQUEST HEADERS */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: "600", color: "var(--foreground)" }}>
              Custom request headers
            </label>
            <span
              style={{
                fontSize: "11px",
                color: "var(--muted-foreground)",
                lineHeight: "1.4"
              }}
            >
              Key/value pairs added here are merged into the OpenAI SDK default_headers for
              custom HTTP headers. Values must be strings.
            </span>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "4px"
              }}
            >
              <span style={{ fontSize: "13px", color: "var(--muted-foreground)" }}>
                No items
              </span>
              <Button type="button" variant="outline" size="sm">
                Modify
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
