"use client";

import React from "react";

export interface ConfiguredModel {
  id: string;
  name: string;
  providerName?: string;
  providerType?: string;
}

export interface ChatHeaderProps {
  conversationId: string;
  status: string;
  configuredModelsList: ConfiguredModel[];
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

const PROVIDER_TYPE_MAP: Record<string, string> = {
  openai: "OpenAI",
  gemini: "Gemini",
  google: "Gemini",
  anthropic: "Anthropic",
  claude: "Anthropic",
  ollama: "Ollama",
  huggingface: "HuggingFace",
  mistral: "Mistral",
  deepseek: "DeepSeek",
  vllm: "vLLM",
  lmstudio: "LM Studio",
  azure: "Azure OpenAI",
  groq: "Groq",
  together: "Together AI",
  openrouter: "OpenRouter",
  cohere: "Cohere",
};

export function ChatHeader({
  conversationId,
  status,
  configuredModelsList,
  selectedModel,
  onModelChange,
}: ChatHeaderProps) {
  return (
    <div
      style={{
        padding: "10px 16px",
        borderBottom: "1px solid var(--border)",
        background: "var(--muted)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: "12px",
      }}
    >
      <span>
        Active Conversation: <strong style={{ fontFamily: "var(--font-mono)", color: "var(--foreground)" }}>{conversationId}</strong>
      </span>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {configuredModelsList.length > 0 ? (
          <select
            value={selectedModel}
            onChange={(e) => onModelChange(e.target.value)}
            style={{
              padding: "3px 28px 3px 10px",
              borderRadius: "12px",
              border: "1px solid var(--border)",
              background: "var(--background)",
              color: "var(--foreground)",
              fontSize: "11px",
              fontWeight: "600",
              outline: "none",
              cursor: "pointer",
              appearance: "none",
              WebkitAppearance: "none",
              MozAppearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23605e5c' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 8px center",
            }}
          >
            {configuredModelsList.map((m) => {
              let cleanModel = (m.name || m.id || "").trim();
              let prev = "";
              while (cleanModel !== prev && cleanModel.includes("/")) {
                prev = cleanModel;
                const parts = cleanModel.split("/");
                const first = parts[0].toLowerCase();
                if (
                  first.includes("openai") ||
                  first.includes("gemini") ||
                  first.includes("claude") ||
                  first.includes("anthropic") ||
                  first.includes("ollama") ||
                  first.includes("huggingface") ||
                  first.includes("deepseek") ||
                  first.includes("provider") ||
                  first.includes("models")
                ) {
                  cleanModel = parts.slice(1).join("/");
                }
              }

              const sourceId = (m.providerName || "provider").trim();
              const pType = (m.providerType || "").trim();

              let pLabel = "";
              if (pType && PROVIDER_TYPE_MAP[pType.toLowerCase()]) {
                pLabel = PROVIDER_TYPE_MAP[pType.toLowerCase()];
              } else if (sourceId) {
                const s = sourceId.toLowerCase();
                for (const [k, v] of Object.entries(PROVIDER_TYPE_MAP)) {
                  if (s.includes(k)) {
                    pLabel = v;
                    break;
                  }
                }
              }
              if (!pLabel) {
                const fallback = pType || sourceId;
                pLabel = fallback ? fallback.charAt(0).toUpperCase() + fallback.slice(1) : "";
              }

              const label = `${pLabel ? `(${pLabel}) ` : ""}${sourceId}/${cleanModel}`;
              return (
                <option key={m.id} value={m.id}>
                  {label}
                </option>
              );
            })}
          </select>
        ) : (
          <span style={{ fontSize: "10px", color: "var(--muted-foreground)" }}>
            No Models Configured
          </span>
        )}

        <span
          style={{
            fontSize: "10px",
            padding: "3px 8px",
            borderRadius: "10px",
            background: status === "ACTIVE" ? "var(--color-status-soft)" : "var(--border)",
            color: status === "ACTIVE" ? "var(--foreground)" : "var(--muted-foreground)",
            fontWeight: "bold",
            textTransform: "uppercase",
          }}
        >
          {status}
        </span>
      </div>
    </div>
  );
}
