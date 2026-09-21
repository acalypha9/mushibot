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
