"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Eye, EyeOff } from "lucide-react";
import { ModelProvider, ProviderFormData, PROVIDER_PRESETS } from "../types";

export interface ProviderCredentialsSectionProps {
  selectedProvider: ModelProvider | null;
  formData: ProviderFormData;
  updateFormData: (
    updater: Partial<ProviderFormData> | ((prev: ProviderFormData) => ProviderFormData)
  ) => void;
  onOpenApiKeyModal: () => void;
}

export function ProviderCredentialsSection({
  selectedProvider,
  formData,
  updateFormData,
  onOpenApiKeyModal
}: ProviderCredentialsSectionProps) {
  const [showApiKey, setShowApiKey] = useState(false);

  const defaultBaseUrl =
    PROVIDER_PRESETS.find(
      (p) => p.type === (formData.provider_type || selectedProvider?.provider_type)
    )?.defaultBaseUrl || "https://api.openai.com/v1";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--foreground)", margin: 0 }}>
        Settings
      </h3>

      {/* ID FIELD */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <label style={{ fontSize: "13px", fontWeight: "600", color: "var(--foreground)" }}>
          ID
        </label>
        <Input
          type="text"
          name="provider_source_identifier"
          autoComplete="off"
          data-lpignore="true"
          data-1p-ignore="true"
          spellCheck={false}
          value={formData.name || ""}
          onChange={(e) => updateFormData({ name: e.target.value })}
        />
        <span style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>
          Provider source ID (not provider ID)
        </span>
      </div>

      {/* API KEY FIELD */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <label style={{ fontSize: "13px", fontWeight: "600", color: "var(--foreground)" }}>
          API Key
        </label>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div
            style={{
              position: "relative",
              display: "flex",
              flexGrow: 1,
              alignItems: "center"
            }}
          >
            <Input
              type="text"
              name="provider_auth_token_key"
              autoComplete="off"
              data-form-type="other"
              data-lpignore="true"
              data-1p-ignore="true"
              data-bwignore="true"
              data-dashlane-ignore="true"
              spellCheck={false}
              value={formData.api_key || ""}
              onChange={(e) => updateFormData({ api_key: e.target.value })}
              placeholder="API key for authentication"
              style={
                {
                  paddingRight: "38px",
                  fontFamily: "var(--font-mono)",
                  WebkitTextSecurity: showApiKey ? "none" : "disc",
                  textSecurity: showApiKey ? "none" : "disc"
                } as React.CSSProperties
              }
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowApiKey(!showApiKey)}
              style={{
                position: "absolute",
                right: "10px",
                color: "var(--muted-foreground)",
                padding: "2px",
                display: "flex",
                alignItems: "center"
              }}
              title={showApiKey ? "Hide API key" : "Show API key"}
            >
              {showApiKey ? (
                <EyeOff style={{ width: "16px", height: "16px" }} />
              ) : (
                <Eye style={{ width: "16px", height: "16px" }} />
              )}
            </Button>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenApiKeyModal}
            style={{
              whiteSpace: "nowrap"
            }}
          >
            Add More
          </Button>
        </div>
        <span style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>
          {formData.provider_type === "huggingface"
            ? "Optional. HuggingFace models run locally on your machine without requiring an API key."
            : "API key for authentication"}
        </span>
      </div>

      {/* API BASE URL FIELD */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <label style={{ fontSize: "13px", fontWeight: "600", color: "var(--foreground)" }}>
          API Base URL
        </label>
        <Input
          type="text"
          value={formData.base_url || ""}
          onChange={(e) => updateFormData({ base_url: e.target.value })}
          placeholder={defaultBaseUrl}
          style={{
            fontFamily: "var(--font-mono)"
          }}
        />
        <span style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>
          Custom API endpoint URL
        </span>
      </div>
    </div>
  );
}
