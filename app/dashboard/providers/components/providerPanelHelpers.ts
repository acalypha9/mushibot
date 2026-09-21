import type { AvailableModelItem, ConfiguredModel } from "../types";
import { cleanRawModelId } from "../metadata";

export function filterModelsBySearch<T extends { id: string; name?: string }>(
  items: T[],
  searchTerm: string
): T[] {
  const normalized = searchTerm.trim().toLowerCase();
  if (!normalized) return items;
  return items.filter(
    (item) =>
      item.id.toLowerCase().includes(normalized) ||
      (item.name && item.name.toLowerCase().includes(normalized))
  );
}

export function resolveModelCapabilities(m: AvailableModelItem | { id: string; [key: string]: unknown }): {
  isVision: boolean;
  isAudio: boolean;
  isTools: boolean;
  isReasoning: boolean;
  ctxLen: string;
} {
  const idLower = m.id.toLowerCase();
  const raw = m as Record<string, unknown>;

  const isVision =
    typeof raw.has_vision === "boolean"
      ? raw.has_vision
      : idLower.includes("vision") ||
        idLower.includes("gpt-4o") ||
        idLower.includes("claude") ||
        idLower.includes("gemini") ||
        idLower.includes("fable");

  const isAudio =
    typeof raw.has_audio === "boolean"
      ? raw.has_audio
      : idLower.includes("audio") || idLower.includes("whisper");

  const isTools = typeof raw.has_tools === "boolean" ? raw.has_tools : true;

  const isReasoning =
    typeof raw.has_reasoning === "boolean"
      ? raw.has_reasoning
      : idLower.includes("o1") ||
        idLower.includes("o3") ||
        idLower.includes("r1") ||
        idLower.includes("deepseek") ||
        idLower.includes("fable") ||
        idLower.includes("opus") ||
        idLower.includes("haiku");

  const ctxLen =
    typeof raw.context_length === "string" && raw.context_length
      ? raw.context_length
      : idLower.includes("1m")
      ? "1M"
      : idLower.includes("200k")
      ? "200K"
      : idLower.includes("262k")
      ? "262K"
      : "128K";

  return {
    isVision,
    isAudio,
    isTools,
    isReasoning,
    ctxLen
  };
}

export function buildConfiguredModelFromAvailable(
  m: AvailableModelItem | { id: string; name?: string; [key: string]: unknown }
): ConfiguredModel {
  const cleanId = cleanRawModelId(m.id);
  const cleanName = cleanRawModelId(m.name || m.id);
  const caps = resolveModelCapabilities(m);

  return {
    id: cleanId,
    name: cleanName,
    is_active: true,
    has_vision: caps.isVision,
    has_audio: caps.isAudio,
    has_tools: caps.isTools,
    has_reasoning: caps.isReasoning,
    context_length: caps.ctxLen
  };
}

export function toggleConfiguredModelActive(
  models: ConfiguredModel[],
  modelId: string
): ConfiguredModel[] {
  return models.map((m) =>
    m.id === modelId ? { ...m, is_active: !m.is_active } : m
  );
}

export function removeConfiguredModelById(
  models: ConfiguredModel[],
  modelId: string
): ConfiguredModel[] {
  return models.filter((m) => m.id !== modelId);
}
