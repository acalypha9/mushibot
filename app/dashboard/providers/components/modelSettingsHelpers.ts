import type { ConfiguredModel, ProviderFormData } from "../types";
import { resolveModelMetadata, parseToNumberString } from "../metadata";

export interface ModelSettingsState {
  modelEnable: boolean;
  modelHasText: boolean;
  modelHasVision: boolean;
  modelHasAudio: boolean;
  modelHasTools: boolean;
  modelContextWindow: string;
  modelReasoning: string;
  modelReasoningEffort: string;
  modelTemperature: string;
  parserTier: string;
  parserVersion: string;
  parserOutputTables: boolean;
  parserCompactTables: boolean;
  parserDisableCache: boolean;
  parserPageRanges: string;
  modelExecutionDevice: string;
  modelNormalizeEmbeddings: boolean;
}

export function initializeSettingsState(
  editingModel: ConfiguredModel,
  modelsDevMap: Record<string, unknown> | null | undefined,
  formData: ProviderFormData
): ModelSettingsState {
  const meta =
    (editingModel.id || editingModel.name) && modelsDevMap
      ? resolveModelMetadata(
          editingModel.id || editingModel.name,
          modelsDevMap as Record<string, {
            attachment?: boolean;
            modalities?: { input?: string[]; output?: string[] };
            tool_call?: boolean;
            reasoning?: boolean;
            limit?: { context?: number };
          }>
        )
      : null;

  const visionVal = meta
    ? meta.attachment ||
      meta.modalities?.input?.some((m: string) => ["image", "pdf", "video"].includes(m))
    : (editingModel.has_vision ?? false);
  const audioVal = meta
    ? meta.modalities?.input?.includes("audio") || meta.modalities?.output?.includes("audio")
    : (editingModel.has_audio ?? false);
  const toolsVal = meta ? (meta.tool_call ?? true) : (editingModel.has_tools ?? true);
  const reasoningVal = meta ? meta.reasoning : (editingModel.has_reasoning ?? false);
  const contextVal = meta?.limit?.context
    ? meta.limit.context.toString()
    : editingModel.context_length
    ? parseToNumberString(editingModel.context_length)
    : "0";

  return {
    modelEnable: editingModel.is_active ?? true,
    modelHasText: true,
    modelHasVision: visionVal,
    modelHasAudio: audioVal,
    modelHasTools: toolsVal,
    modelContextWindow: contextVal,
    modelReasoning: reasoningVal ? "true" : "false",
    modelReasoningEffort: editingModel.reasoning_effort || "default",
    modelTemperature:
      editingModel.temperature !== undefined ? editingModel.temperature.toString() : "0.3",
    parserTier: editingModel.tier || "agentic",
    parserVersion: editingModel.version || "latest",
    parserOutputTables: editingModel.output_tables_as_markdown ?? true,
    parserCompactTables: editingModel.compact_markdown_tables ?? true,
    parserDisableCache: editingModel.disable_cache ?? false,
    parserPageRanges: editingModel.page_ranges || "",
    modelExecutionDevice: editingModel.device || formData.device || "gpu",
    modelNormalizeEmbeddings:
      editingModel.normalize_embeddings ?? formData.normalize_embeddings ?? true,
  };
}

export function checkReasoningSupported(
  editingModel: ConfiguredModel | null,
  modelReasoning: string
): boolean {
  return (
    modelReasoning === "true" ||
    (editingModel
      ? editingModel.has_reasoning ??
        (editingModel.id.toLowerCase().includes("r1") ||
          editingModel.id.toLowerCase().includes("deepseek") ||
          editingModel.id.toLowerCase().includes("o1") ||
          editingModel.id.toLowerCase().includes("o3") ||
          editingModel.id.toLowerCase().includes("thinking") ||
          editingModel.id.toLowerCase().includes("gemini") ||
          editingModel.id.toLowerCase().includes("claude") ||
          editingModel.id.toLowerCase().includes("opus") ||
          editingModel.id.toLowerCase().includes("haiku"))
      : false)
  );
}

export function buildUpdatedModel(
  editingModel: ConfiguredModel,
  state: ModelSettingsState
): ConfiguredModel {
  const parsedTemp = parseFloat(state.modelTemperature);

  return {
    ...editingModel,
    is_active: state.modelEnable,
    has_vision: state.modelHasVision,
    has_audio: state.modelHasAudio,
    has_tools: state.modelHasTools,
    has_reasoning: state.modelReasoning === "true",
    reasoning_effort:
      state.modelReasoningEffort !== "default" ? state.modelReasoningEffort : undefined,
    context_length:
      state.modelContextWindow !== "0" && state.modelContextWindow.trim() !== ""
        ? state.modelContextWindow
        : undefined,
    temperature: !isNaN(parsedTemp) ? parsedTemp : undefined,
    tier: state.parserTier,
    version: state.parserVersion,
    output_tables_as_markdown: state.parserOutputTables,
    compact_markdown_tables: state.parserCompactTables,
    disable_cache: state.parserDisableCache,
    page_ranges: state.parserPageRanges || undefined,
    device: state.modelExecutionDevice,
    normalize_embeddings: state.modelNormalizeEmbeddings,
  };
}
