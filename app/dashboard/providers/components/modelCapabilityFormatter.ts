import { resolveModelMetadata, formatTokenCount } from "../metadata";

export interface CapabilityBadgeItem {
  key: string;
  badgeLabel?: string;
  title: string;
  modelName?: string;
  description: string;
  details: (string | null | undefined)[];
  color: string;
  iconType: "info" | "vision" | "audio" | "tools" | "reasoning" | "structured" | "openWeights" | "context" | "parser" | "embedding";
}

export interface ModelCapabilityOptions {
  modelId?: string;
  hasVision?: boolean;
  hasAudio?: boolean;
  hasTools?: boolean;
  hasReasoning?: boolean;
  contextLength?: string;
  modelsDevMap?: Record<string, unknown>;
  category?: string;
  dimensions?: number | string;
}

export function computeCapabilityBadges(options: ModelCapabilityOptions): {
  kind: "parser" | "embedding" | "standard";
  items: CapabilityBadgeItem[];
} {
  const {
    modelId,
    hasVision,
    hasAudio,
    hasTools,
    hasReasoning,
    contextLength,
    modelsDevMap,
    category,
    dimensions
  } = options;

  const meta = modelId && modelsDevMap ? resolveModelMetadata(modelId, modelsDevMap) : null;
  const modelName = meta?.name || modelId;

  const isParser = category === "parser" || Boolean(modelId && (modelId.toLowerCase().includes("parse") || modelId.toLowerCase().includes("llamaindex")));
  const isEmbedding = category === "embedding" || Boolean(modelId && (modelId.toLowerCase().includes("embedding") || modelId.toLowerCase().includes("bge") || modelId.toLowerCase().includes("embed")));

  if (isParser) {
    return {
      kind: "parser",
      items: [
        {
          key: "parser",
          title: "Document Parser",
          modelName: modelName || "LlamaParse",
          description: "Agentic OCR and parsing for 130+ formats. Turn PDFs and scans into LLM ready text - the foundation for document agents.",
          details: [],
          color: "#0284c7",
          iconType: "parser"
        }
      ]
    };
  }

  if (isEmbedding) {
    const dimVal = (dimensions || meta?.limit?.output || "1536").toString();
    return {
      kind: "embedding",
      items: [
        {
          key: "embedding",
          badgeLabel: dimVal,
          title: "Vector Dimension",
          modelName,
          description: `Embedding vector dimension size (${dimVal} dimensions).`,
          details: [`Dimensions: ${dimVal}`],
          color: "#0284c7",
          iconType: "embedding"
        }
      ]
    };
  }

  const isVision = meta ? Boolean(meta.attachment || meta.modalities?.input?.some((m: string) => ["image", "pdf", "video"].includes(m))) : hasVision;
  const isAudio = meta ? Boolean(meta.modalities?.input?.includes("audio") || meta.modalities?.output?.includes("audio")) : hasAudio;
  const isTools = meta ? (meta.tool_call ?? true) : hasTools;
  const isReasoning = meta ? Boolean(meta.reasoning) : hasReasoning;
  const isStructured = Boolean(meta?.structured_output);
  const isOpenWeights = Boolean(meta?.open_weights);

  const ctxLen = meta?.limit?.context ? formatTokenCount(meta.limit.context) : formatTokenCount(contextLength);
  const modelDesc = meta?.description || "Model feature specs and capabilities";

  const items: CapabilityBadgeItem[] = [
    {
      key: "overview",
      title: meta?.name || modelName || modelId || "Model Overview",
      modelName: meta?.name || modelName,
      description: modelDesc,
      details: [
        meta?.providerName ? `Provider: ${meta.providerName}` : null,
        meta?.family ? `Family: ${meta.family}` : null,
        meta?.knowledge ? `Knowledge Cutoff: ${meta.knowledge}` : null,
        meta?.release_date ? `Release Date: ${meta.release_date}` : null,
        meta?.cost?.input !== undefined ? `Pricing (1M tokens): In $${meta.cost.input} / Out $${meta.cost.output}` : null,
        isOpenWeights ? "Open Source: Yes (Self-hostable)" : "Proprietary Model"
      ],
      color: "#64748b",
      iconType: "info"
    }
  ];

  if (isVision) {
    items.push({
      key: "vision",
      title: "Vision & Multimodal",
      modelName,
      description: modelDesc,
      details: [
        meta?.modalities?.input ? `Input Types: ${meta.modalities.input.join(", ")}` : "Image & document vision support",
        meta?.attachment ? "Attachment Uploads: Supported" : "Visual document processing"
      ],
      color: "#3b82f6",
      iconType: "vision"
    });
  }

  if (isAudio) {
    items.push({
      key: "audio",
      title: "Audio Capabilities",
      modelName,
      description: modelDesc,
      details: [
        meta?.modalities?.input?.includes("audio") ? "Audio Input: Speech recognition" : null,
        meta?.modalities?.output?.includes("audio") ? "Audio Output: Speech synthesis" : null
      ],
      color: "#ec4899",
      iconType: "audio"
    });
  }

  if (isTools) {
    items.push({
      key: "tools",
      title: "Tool Calling & Functions",
      modelName,
      description: modelDesc,
      details: [
        "Function Calling: Enabled",
        meta?.structured_output ? "Structured Output (JSON Schema): Supported" : null,
        meta?.temperature !== false ? "Custom Temperature: Supported" : null
      ],
      color: "#f59e0b",
      iconType: "tools"
    });
  }

  if (isReasoning) {
    items.push({
      key: "reasoning",
      title: "Deep Reasoning",
      modelName,
      description: modelDesc,
      details: [
        "Chain-of-Thought Logic: Supported",
        ...(meta?.reasoning_options ? meta.reasoning_options.map((r: { type: string; values?: string[] }) => `Reasoning Mode: ${r.type}${r.values ? ` (${r.values.join(", ")})` : ""}`) : []),
        ...(meta?.benchmarks ? meta.benchmarks.slice(0, 2).map((b: { name: string; score: number | string; metric?: string }) => `${b.name}: ${b.score}${b.metric ? ` (${b.metric})` : ""}`) : [])
      ],
      color: "#8b5cf6",
      iconType: "reasoning"
    });
  }

  if (isStructured) {
    items.push({
      key: "structured",
      title: "Structured Output",
      modelName,
      description: "Guarantees response adherence to JSON schemas & structured formats",
      details: ["Schema Enforcement: Active"],
      color: "#10b981",
      iconType: "structured"
    });
  }

  if (isOpenWeights) {
    items.push({
      key: "openWeights",
      title: "Open Source",
      modelName,
      description: "Open source model weights available for self-hosting",
      details: [meta?.license ? `License: ${meta.license}` : "Open source model"],
      color: "#6366f1",
      iconType: "openWeights"
    });
  }

  if (ctxLen) {
    items.push({
      key: "context",
      badgeLabel: ctxLen,
      title: `Context Window: ${ctxLen}`,
      modelName,
      description: "Maximum context window and token capacity limits",
      details: [
        meta?.limit?.context ? `Max Context: ${meta.limit.context.toLocaleString()} tokens` : `Context: ${ctxLen}`,
        meta?.limit?.output ? `Max Output: ${meta.limit.output.toLocaleString()} tokens (${formatTokenCount(meta.limit.output)})` : null,
        meta?.knowledge ? `Knowledge Cutoff: ${meta.knowledge}` : null,
        meta?.release_date ? `Release Date: ${meta.release_date}` : null
      ],
      color: "var(--primary)",
      iconType: "context"
    });
  }

  return {
    kind: "standard",
    items
  };
}
