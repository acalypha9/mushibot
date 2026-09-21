"use client";

import React, { useState } from "react";
import { Sparkles } from "lucide-react";

interface ProviderIconProps {
  type: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

const PROVIDER_SLUG_MAP: Record<string, string> = {
  llamaindex: "llamaindex",
  llamaparse: "llamaindex",
  llama_cloud: "llamaindex",
  "llama-cloud": "llamaindex",
  openai: "openai",
  openai_compatible: "openai",
  "openai-compatible": "openai",
  gemini: "gemini",
  google: "gemini",
  "google-gemini": "gemini",
  anthropic: "anthropic",
  claude: "claude",
  deepseek: "deepseek",
  moonshot: "moonshot",
  kimi: "kimi",
  ollama: "ollama",
  openrouter: "openrouter",
  azure: "azure",
  azure_openai: "azure",
  "azure-openai": "azure",
  zhipu: "zhipu",
  glm: "zhipu",
  chatglm: "chatglm",
  minimax: "minimax",
  xiaomi: "xiaomimimo",
  mimo: "xiaomimimo",
  xiaomimimo: "xiaomimimo",
  xai: "xai",
  grok: "grok",
  longcat: "longcat",
  nvidia: "nvidia",
  nvidia_nim: "nvidia",
  "nvidia-nim": "nvidia",
  huggingface: "huggingface",
  hf: "huggingface",
  mistral: "mistral",
  groq: "groq",
  qwen: "qwen",
  alibaba: "alibaba",
  doubao: "doubao",
  bytedance: "bytedance",
  siliconcloud: "siliconcloud",
  silicon: "siliconcloud",
  baichuan: "baichuan",
  cohere: "cohere",
  stepfun: "stepfun",
  together: "together",
  perplexity: "perplexity",
  aws: "aws",
  bedrock: "bedrock",
  cloudflare: "cloudflare",
  workersai: "workersai",
  meta: "meta",
  replicate: "replicate",
  volcengine: "volcengine",
  yi: "yi",
  zeroone: "zeroone",
  custom: "lobehub"
};

export function ProviderIcon({ type, size = 24, className = "", style = {} }: ProviderIconProps) {
  const normalizedType = (type || "").toLowerCase().trim();
  const slug = PROVIDER_SLUG_MAP[normalizedType] || normalizedType;
  const [imgError, setImgError] = useState(false);
  const [useBaseSvg, setUseBaseSvg] = useState(false);

  if (imgError || !slug) {
    return (
      <Sparkles
        style={{ width: `${size}px`, height: `${size}px`, flexShrink: 0, color: "var(--primary)", ...style }}
        className={className}
      />
    );
  }

  const src = useBaseSvg
    ? `https://cdn.jsdelivr.net/npm/@lobehub/icons-static-svg@latest/icons/${slug}.svg`
    : `https://cdn.jsdelivr.net/npm/@lobehub/icons-static-svg@latest/icons/${slug}-color.svg`;

  return (
    <img
      src={src}
      alt={`${slug} icon`}
      width={size}
      height={size}
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        objectFit: "contain",
        flexShrink: 0,
        display: "inline-block",
        ...style
      }}
      onError={() => {
        if (!useBaseSvg) {
          setUseBaseSvg(true);
        } else {
          setImgError(true);
        }
      }}
    />
  );
}




