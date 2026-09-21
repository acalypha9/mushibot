
export interface WhatsAppStatus {
  status: "DISCONNECTED" | "CONNECTING" | "QR_READY" | "CONNECTED";
  qrCodeDataUrl: string | null;
  userInfo: {
    jid?: string;
    name?: string;
    phone?: string;
  } | null;
  autoReplyEnabled: boolean;
  lastError: string | null;
  updatedAt: string;
}

export interface ChannelItem {
  id: string;
  name: string;
  type: "WHATSAPP" | "TELEGRAM";
  description?: string;
  autoReplyEnabled: boolean;
  boundPhone?: string;
  messageRateLimit?: number;
  maxTokens?: number;
  timeoutSeconds?: number;
  sessionTimeoutSeconds?: number;
  typingDelayMs?: number;
  replyMode?: "all" | "specific";
  allowPrivate?: boolean;
  allowGroup?: boolean;
  whitelist?: string;
  blacklist?: string;
  commandPrefix?: string;
  systemPrompt?: string;
  model?: string;
  retrievalK?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TelegramStatus {
  status: "DISCONNECTED" | "CONNECTING" | "CONNECTED";
  botInfo: {
    id?: number;
    username?: string;
    firstName?: string;
  } | null;
  botToken: string | null;
  autoReplyEnabled: boolean;
  systemPrompt: string | null;
  model: string | null;
  lastError: string | null;
  updatedAt: string;
}

export interface ModelOptionItem {
  id: string;
  name: string;
  providerType?: string;
  providerName?: string;
}

export interface WaGroupItem {
  id: string;
  subject: string;
  participantsCount: number;
}

export function formatModelLabel(m: { id: string; name?: string; providerType?: string; providerName?: string }): string {
  const rawId = m.id || m.name || "";
  const pType = m.providerType || "";
  const pName = m.providerName || "";

  let cleanModel = rawId.trim().replace(/^models\//, "");
  let sourceId = pName;
  if (cleanModel.includes("/")) {
    const parts = cleanModel.split("/");
    if (!sourceId) sourceId = parts[0];
    cleanModel = parts.slice(1).join("/").replace(/^models\//, "");
  }

  let pLabel = "";
  if (pType) {
    const pt = pType.toLowerCase();
    if (pt === "openai") pLabel = "OpenAI";
    else if (pt === "gemini" || pt === "google") pLabel = "Gemini";
    else if (pt === "anthropic" || pt === "claude") pLabel = "Anthropic";
    else if (pt === "huggingface") pLabel = "HuggingFace";
    else if (pt === "deepseek") pLabel = "DeepSeek";
    else if (pt === "vllm") pLabel = "vLLM";
    else if (pt === "ag") pLabel = "Ag";
    else pLabel = pType.charAt(0).toUpperCase() + pType.slice(1);
  }
  if (!pLabel && sourceId) {
    const s = sourceId.toLowerCase();
    if (s.includes("openai")) pLabel = "OpenAI";
    else if (s.includes("gemini")) pLabel = "Gemini";
    else if (s.includes("claude") || s.includes("anthropic")) pLabel = "Anthropic";
    else if (s.includes("ollama")) pLabel = "Ollama";
    else if (s.includes("huggingface")) pLabel = "HuggingFace";
    else if (s.includes("deepseek")) pLabel = "DeepSeek";
    else if (s === "ag") pLabel = "Ag";
    else pLabel = sourceId.charAt(0).toUpperCase() + sourceId.slice(1);
  }

  return `${pLabel ? `(${pLabel}) ` : ""}${sourceId ? `${sourceId}/` : ""}${cleanModel}`;
}

export function getChannelModelDisplay(
  modelId: string | undefined | null,
  configuredModels: ModelOptionItem[],
  defaultModelName: string
): string {
  const defText = defaultModelName ? `Default (${defaultModelName})` : "Default";
  if (!modelId) return defText;

  const matched = configuredModels.find((m) => m.id === modelId || m.name === modelId);
  if (!matched) {
    return defText;
  }
  return formatModelLabel(matched);
}

export interface ChannelCardStatusResult {
  isConnected: boolean;
  phoneNum?: string;
  tgUsername?: string;
}

export function getChannelCardStatus(params: {
  channel: ChannelItem;
  selectedChannel?: ChannelItem | null;
  waStatus?: WhatsAppStatus | null;
  tgStatus?: TelegramStatus | null;
  waStatusesMap: Record<string, WhatsAppStatus>;
  telegramStatusesMap: Record<string, TelegramStatus>;
}): ChannelCardStatusResult {
  const { channel, selectedChannel, waStatus, tgStatus, waStatusesMap, telegramStatusesMap } = params;
  const isWa = channel.type === "WHATSAPP";
  const isTg = channel.type === "TELEGRAM";
  const isSel = Boolean(selectedChannel && selectedChannel.id === channel.id);
  const chanWaStatus = waStatusesMap[channel.id] || (isSel ? waStatus : null);
  const chanTgStatus = telegramStatusesMap[channel.id] || (isSel ? tgStatus : null);
  const isConnected = isWa
    ? Boolean(
        chanWaStatus?.status === "CONNECTED" ||
          (channel.boundPhone && waStatus?.status === "CONNECTED" && channel.boundPhone === waStatus?.userInfo?.phone)
      )
    : isTg
    ? chanTgStatus?.status === "CONNECTED"
    : false;
  const phoneNum = chanWaStatus?.userInfo?.phone || channel.boundPhone;
  const tgUsername = chanTgStatus?.botInfo?.username;

  return {
    isConnected,
    phoneNum: phoneNum || undefined,
    tgUsername: tgUsername || undefined,
  };
}

export function validateAddChannelInput(name: string, type: string): { isValid: boolean; error: string | null } {
  const trimmedName = name.trim();
  if (!trimmedName) {
    return { isValid: false, error: "Channel name is required" };
  }
  if (type !== "WHATSAPP" && type !== "TELEGRAM") {
    return { isValid: false, error: "Channel type must be either WHATSAPP or TELEGRAM" };
  }
  return { isValid: true, error: null };
}

