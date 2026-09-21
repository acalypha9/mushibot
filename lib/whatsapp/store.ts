import fs from "fs";
import path from "path";
import type { proto } from "@whiskeysockets/baileys";
import type { WhatsAppStore, WhatsAppStatus } from "./types";

declare global {
  // eslint-disable-next-line no-var
  var __whatsapp_sessions: Map<string, WhatsAppStore> | undefined;
  // eslint-disable-next-line no-var
  var __whatsapp_keepalive_timer: NodeJS.Timeout | undefined;
  // eslint-disable-next-line no-var
  var __whatsapp_incoming_handler: ((store: WhatsAppStore, m: any) => Promise<void>) | undefined;
}

if (!globalThis.__whatsapp_sessions) {
  globalThis.__whatsapp_sessions = new Map<string, WhatsAppStore>();
}

export const sessions = globalThis.__whatsapp_sessions;
export const lidToPnStore = new Map<string, string>();
export const msgRetryCache = new Map<string, number>();
export const recentMessagesMap = new Map<string, proto.IMessage>();
export const groupsCache = new Map<
  string,
  { list: Array<{ id: string; subject: string; participantsCount: number }>; timestamp: number }
>();
export const inFlightGroupFetches = new Map<
  string,
  Promise<Array<{ id: string; subject: string; participantsCount: number }>>
>();

export function sanitizeSessionId(id?: string): string {
  if (!id || id === "default" || id === "WHATSAPP") return "default";
  return id.replace(/[^a-zA-Z0-9_-]/g, "_");
}

export function getAuthFolder(id?: string, ensureExists = false): string {
  const clean = sanitizeSessionId(id);
  const authDir = path.join(process.cwd(), "auth", "whatsapp", clean);
  if (ensureExists && clean !== "default" && !fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
  return authDir;
}

export function getConfigFile(id?: string): string {
  return path.join(getAuthFolder(id, false), "whatsapp_config.json");
}

export function loadPersistedConfig(s: WhatsAppStore) {
  try {
    const configFile = getConfigFile(s.sessionId);
    if (fs.existsSync(configFile)) {
      const raw = fs.readFileSync(configFile, "utf-8");
      const data = JSON.parse(raw);
      if (typeof data.autoReplyEnabled === "boolean") s.autoReplyEnabled = data.autoReplyEnabled;
      if (data.systemPrompt !== undefined) s.systemPrompt = data.systemPrompt;
      if (data.model !== undefined) s.model = data.model;
      if (data.commandPrefix !== undefined) s.commandPrefix = data.commandPrefix;
      if (typeof data.responseTimeout === "number" && data.responseTimeout > 30) {
        s.responseTimeout = data.responseTimeout;
      } else {
        s.responseTimeout = 120;
      }
      if (typeof data.userIntentDisconnect === "boolean") {
        s.userIntentDisconnect = data.userIntentDisconnect;
      }
      if (typeof data.sessionTimeout === "number" && data.sessionTimeout > 0) {
        s.sessionTimeout = data.sessionTimeout;
      } else {
        s.sessionTimeout = 300;
      }
    }
  } catch (err) {
    console.error(`Failed to load persisted WhatsApp config for session ${s.sessionId}:`, err);
  }
}

export function savePersistedConfig(s: WhatsAppStore) {
  try {
    const authFolder = getAuthFolder(s.sessionId);
    const configFile = getConfigFile(s.sessionId);
    if (!fs.existsSync(authFolder)) {
      fs.mkdirSync(authFolder, { recursive: true });
    }
    let existing: any = {};
    if (fs.existsSync(configFile)) {
      try {
        existing = JSON.parse(fs.readFileSync(configFile, "utf-8"));
      } catch {}
    }
    const data = {
      ...existing,
      userIntentDisconnect: s.userIntentDisconnect,
      autoReplyEnabled: s.autoReplyEnabled,
      systemPrompt: s.systemPrompt,
      model: s.model,
      commandPrefix:
        s.commandPrefix !== undefined && s.commandPrefix !== null
          ? s.commandPrefix
          : existing.commandPrefix,
      responseTimeout: s.responseTimeout,
      sessionTimeout: s.sessionTimeout,
    };
    fs.writeFileSync(configFile, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`Failed to save WhatsApp config for session ${s.sessionId}:`, err);
  }
}

export function getOrCreateStore(channelId: string = "default"): WhatsAppStore {
  const key = sanitizeSessionId(channelId);
  const existing = sessions.get(key);
  if (existing) {
    return existing;
  }
  const newStore: WhatsAppStore = {
    sessionId: key,
    sock: null,
    status: "DISCONNECTED",
    qrCodeDataUrl: null,
    userInfo: null,
    autoReplyEnabled: true,
    systemPrompt: null,
    model: null,
    commandPrefix: null,
    responseTimeout: 120,
    sessionTimeout: 300,
    lastError: null,
    isInitializing: false,
    userIntentDisconnect: false,
    qrGeneratedAt: null,
    qrTimeoutTimer: null,
    reconnectTimer: null,
    connectingStartedAt: null,
    retryCount: 0,
  };
  loadPersistedConfig(newStore);
  sessions.set(key, newStore);
  return newStore;
}

export function hasExistingSession(channelId?: string): boolean {
  try {
    const authFolder = getAuthFolder(channelId);
    const credsFile = path.join(authFolder, "creds.json");
    if (!fs.existsSync(credsFile)) return false;
    const content = fs.readFileSync(credsFile, "utf-8").trim();
    if (!content || content === "{}" || content.length < 10) return false;
    const data = JSON.parse(content);
    return !!(data.me?.id || data.me?.jid || data.account?.details || data.registered === true);
  } catch {
    return false;
  }
}

export function clearAuthFolder(channelId?: string): void {
  try {
    const store = getOrCreateStore(channelId);
    if (store.reconnectTimer) {
      clearTimeout(store.reconnectTimer);
      store.reconnectTimer = null;
    }
    if (store.sock) {
      try {
        store.sock.ev.removeAllListeners("connection.update");
        (store.sock as any).ws?.close();
        store.sock.end(undefined);
      } catch (e) {}
      store.sock = null;
    }
    const clean = sanitizeSessionId(channelId);
    const authFolder = path.join(process.cwd(), "auth", "whatsapp", clean);
    if (fs.existsSync(authFolder)) {
      fs.rmSync(authFolder, { recursive: true, force: true });
      console.log(`[WhatsApp Auth] Removed auth folder for disconnected session: ${clean}`);
    }
  } catch (err) {
    console.error(`[WARN] Failed to clear auth directory for ${channelId}:`, err);
  }
}

export function setAutoReply(
  channelId?: string,
  enabled = true,
  systemPrompt?: string,
  model?: string,
  responseTimeout?: number,
  sessionTimeout?: number
): WhatsAppStatus {
  const store = getOrCreateStore(channelId);
  store.autoReplyEnabled = enabled;
  if (systemPrompt !== undefined) {
    store.systemPrompt = systemPrompt;
  }
  if (model !== undefined) {
    store.model = model;
  }
  if (typeof responseTimeout === "number" && responseTimeout > 0) {
    store.responseTimeout = responseTimeout;
  }
  if (typeof sessionTimeout === "number" && sessionTimeout > 0) {
    store.sessionTimeout = sessionTimeout;
  }
  savePersistedConfig(store);
  console.log(
    `[WhatsApp Config Updated ${store.sessionId}] AutoReply: ${enabled}, Model: ${
      model || "default"
    }, ResponseTimeout: ${store.responseTimeout}s`
  );
  return {
    status: store.status,
    qrCodeDataUrl: store.qrCodeDataUrl,
    userInfo: store.status === "CONNECTED" ? store.userInfo : null,
    autoReplyEnabled: store.autoReplyEnabled,
    systemPrompt: store.systemPrompt,
    model: store.model,
    responseTimeout: store.responseTimeout,
    sessionTimeout: store.sessionTimeout,
    lastError: store.lastError,
    updatedAt: new Date().toISOString(),
  };
}
