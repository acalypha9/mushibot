import type { WASocket } from "@whiskeysockets/baileys";

export interface WhatsAppStatus {
  status: "DISCONNECTED" | "CONNECTING" | "QR_READY" | "CONNECTED";
  qrCodeDataUrl: string | null;
  userInfo: {
    jid?: string;
    name?: string;
    phone?: string;
  } | null;
  autoReplyEnabled: boolean;
  systemPrompt: string | null;
  model: string | null;
  responseTimeout: number | null;
  sessionTimeout: number | null;
  lastError: string | null;
  updatedAt: string;
}

export interface WhatsAppStore {
  sessionId: string;
  sock: WASocket | null;
  status: WhatsAppStatus["status"];
  qrCodeDataUrl: string | null;
  userInfo: WhatsAppStatus["userInfo"];
  autoReplyEnabled: boolean;
  systemPrompt: string | null;
  model: string | null;
  commandPrefix: string | null;
  responseTimeout: number | null;
  sessionTimeout: number | null;
  lastError: string | null;
  isInitializing: boolean;
  userIntentDisconnect: boolean;
  qrGeneratedAt: number | null;
  qrTimeoutTimer: NodeJS.Timeout | null;
  reconnectTimer: NodeJS.Timeout | null;
  connectingStartedAt: number | null;
  retryCount: number;
}

export interface WhatsAppBroadcastOptions {
  blacklist?: string[];
  allowPrivate?: boolean;
  allowGroup?: boolean;
}

export interface WhatsAppBroadcastResult {
  success: boolean;
  sentCount: number;
  errors: string[];
}

export interface WhatsAppGroupInfo {
  id: string;
  subject: string;
  participantsCount: number;
}

export interface ValidateCommandPrefixResult {
  allowed: boolean;
  cleanedMessage: string;
  reason?: string;
}
