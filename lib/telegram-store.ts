import fs from "fs";
import path from "path";
import type { Bot } from "grammy";

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
  responseTimeout: number | null;
  sessionTimeout: number | null;
  lastError: string | null;
  updatedAt: string;
}

export interface TelegramStore {
  sessionId: string;
  bot: Bot | null;
  status: TelegramStatus["status"];
  botInfo: TelegramStatus["botInfo"];
  botToken: string | null;
  autoReplyEnabled: boolean;
  systemPrompt: string | null;
  model: string | null;
  responseTimeout: number | null;
  sessionTimeout: number | null;
  lastError: string | null;
  userIntentDisconnect: boolean;
  isInitializing: boolean;
  lastConnectAttempt?: number;
  autoConnectFailed?: boolean;
}

export function sanitizeSessionId(id?: string): string {
  if (!id || id === "default" || id === "TELEGRAM") return "default";
  return id.replace(/[^a-zA-Z0-9_-]/g, "_");
}

export function getAuthFolder(id?: string, ensureExists = false): string {
  const clean = sanitizeSessionId(id);
  const authDir = path.join(process.cwd(), "auth", "telegram", clean);
  if (ensureExists && clean !== "default" && !fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
  return authDir;
}

export function getConfigFile(id?: string): string {
  return path.join(getAuthFolder(id, false), "telegram_config.json");
}

declare global {
  var __telegram_sessions: Map<string, TelegramStore> | undefined;
}

// Stop any legacy/stale bot instances running in globalThis memory on hot-reload
if (globalThis.__telegram_sessions) {
  for (const s of globalThis.__telegram_sessions.values()) {
    if (s.bot) {
      try {
        console.log(`[Telegram Cleanup] Stopping legacy bot instance for session: ${s.sessionId}`);
        s.bot.stop().catch((err: unknown) => {
          const message = err instanceof Error ? err.message : "Unknown error";
          console.warn(`[Telegram Cleanup] Error stopping legacy bot for session ${s.sessionId}:`, message);
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.warn(`[Telegram Cleanup] Error initiating stop for legacy bot in session ${s.sessionId}:`, message);
      }
      s.bot = null;
      s.status = "DISCONNECTED";
    }
  }
} else {
  globalThis.__telegram_sessions = new Map<string, TelegramStore>();
}

export const sessions = globalThis.__telegram_sessions;

export function getOrCreateStore(channelId: string = "default"): TelegramStore {
  const key = sanitizeSessionId(channelId);
  if (!sessions.has(key)) {
    const newStore: TelegramStore = {
      sessionId: key,
      bot: null,
      status: "DISCONNECTED",
      botInfo: null,
      botToken: null,
      autoReplyEnabled: true,
      systemPrompt: null,
      model: null,
      responseTimeout: 120,
      sessionTimeout: 300,
      lastError: null,
      userIntentDisconnect: false,
      isInitializing: false,
      autoConnectFailed: false,
    };
    loadPersistedConfig(newStore);
    sessions.set(key, newStore);
  }
  return sessions.get(key)!;
}

export function loadPersistedConfig(s: TelegramStore): void {
  try {
    const configFile = getConfigFile(s.sessionId);
    if (fs.existsSync(configFile)) {
      const raw = fs.readFileSync(configFile, "utf-8");
      const data = JSON.parse(raw);
      if (data.botToken) s.botToken = data.botToken;
      if (typeof data.userIntentDisconnect === "boolean") s.userIntentDisconnect = data.userIntentDisconnect;
      if (typeof data.autoReplyEnabled === "boolean") s.autoReplyEnabled = data.autoReplyEnabled;
      if (data.systemPrompt !== undefined) s.systemPrompt = data.systemPrompt;
      if (data.model !== undefined) s.model = data.model;
      if (typeof data.responseTimeout === "number") s.responseTimeout = data.responseTimeout;
      if (typeof data.sessionTimeout === "number") s.sessionTimeout = data.sessionTimeout;
    }
  } catch (err) {
    console.error(`Failed to load persisted Telegram config for session ${s.sessionId}:`, err);
  }
}

export function savePersistedConfig(s: TelegramStore): void {
  try {
    const authFolder = getAuthFolder(s.sessionId);
    const configFile = getConfigFile(s.sessionId);
    if (!fs.existsSync(authFolder)) {
      fs.mkdirSync(authFolder, { recursive: true });
    }
    const data = {
      botToken: s.botToken,
      userIntentDisconnect: s.userIntentDisconnect,
      autoReplyEnabled: s.autoReplyEnabled,
      systemPrompt: s.systemPrompt,
      model: s.model,
      responseTimeout: s.responseTimeout,
      sessionTimeout: s.sessionTimeout,
    };
    fs.writeFileSync(configFile, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`Failed to save Telegram config for session ${s.sessionId}:`, err);
  }
}

export function formatTelegramStatus(store: TelegramStore): TelegramStatus {
  return {
    status: store.status,
    botInfo: store.botInfo,
    botToken: store.botToken ? `${store.botToken.slice(0, 4)}***${store.botToken.slice(-4)}` : null,
    autoReplyEnabled: store.autoReplyEnabled,
    systemPrompt: store.systemPrompt,
    model: store.model,
    responseTimeout: store.responseTimeout,
    sessionTimeout: store.sessionTimeout,
    lastError: store.lastError,
    updatedAt: new Date().toISOString(),
  };
}

export function removeAuthFolder(sessionId: string): void {
  const clean = sanitizeSessionId(sessionId);
  const authFolder = path.join(process.cwd(), "auth", "telegram", clean);
  if (fs.existsSync(authFolder)) {
    try {
      fs.rmSync(authFolder, { recursive: true, force: true });
      console.log(`[Telegram Auth] Removed auth folder for disconnected session: ${clean}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.warn(`[Telegram Auth] Failed to remove auth folder for session ${clean}:`, message);
    }
  }
}
