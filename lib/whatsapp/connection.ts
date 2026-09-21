import fs from "fs";
import path from "path";
import {
  sessions,
  getOrCreateStore,
  hasExistingSession,
  clearAuthFolder,
} from "./store";
import { createAndBindWhatsAppSocket } from "./socket";
import type { WhatsAppStatus } from "./types";

export function getWhatsAppStatus(channelId?: string): WhatsAppStatus {
  const store = getOrCreateStore(channelId);

  if (
    hasExistingSession(channelId) &&
    store.status === "DISCONNECTED" &&
    !store.userIntentDisconnect &&
    !store.isInitializing &&
    !store.sock &&
    !store.reconnectTimer
  ) {
    console.log(
      `[WhatsApp Auto-Connect] Found saved credentials for ${store.sessionId}. Connecting...`
    );
    initWhatsAppSocket(channelId).catch((err) =>
      console.error(`[WhatsApp Auto-Connect Error ${store.sessionId}]:`, err)
    );
  }

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

export async function disconnectWhatsApp(
  channelId: string = "default",
  clearSession = false
): Promise<WhatsAppStatus> {
  const store = getOrCreateStore(channelId);
  store.userIntentDisconnect = true;
  store.isInitializing = false;
  store.connectingStartedAt = null;
  store.status = "DISCONNECTED";
  store.qrCodeDataUrl = null;
  store.qrGeneratedAt = null;
  if (store.qrTimeoutTimer) {
    clearTimeout(store.qrTimeoutTimer);
    store.qrTimeoutTimer = null;
  }
  if (store.reconnectTimer) {
    clearTimeout(store.reconnectTimer);
    store.reconnectTimer = null;
  }
  store.userInfo = null;

  if (store.sock) {
    try {
      store.sock.ev.removeAllListeners("connection.update");
      store.sock.ev.removeAllListeners("creds.update");
      store.sock.ev.removeAllListeners("messages.upsert");
      await store.sock.logout();
    } catch {
      try {
        (store.sock as any).ws?.close();
        store.sock.end(undefined);
      } catch (e) {
        console.error(`[WhatsApp] Error during logout:`, e);
      }
    }
  }

  store.sock = null;

  if (clearSession) {
    clearAuthFolder(channelId);
  }

  return getWhatsAppStatus(channelId);
}

export async function initWhatsAppSocket(
  channelId: string = "default",
  forceRefresh = false
): Promise<WhatsAppStatus> {
  const store = getOrCreateStore(channelId);

  if (forceRefresh) {
    if (store.qrTimeoutTimer) {
      clearTimeout(store.qrTimeoutTimer);
      store.qrTimeoutTimer = null;
    }
    if (store.reconnectTimer) {
      clearTimeout(store.reconnectTimer);
      store.reconnectTimer = null;
    }
    store.qrCodeDataUrl = null;
    store.qrGeneratedAt = null;
    store.retryCount = 0;
    store.connectingStartedAt = null;
    if (store.sock) {
      try {
        store.sock.ev.removeAllListeners("connection.update");
        store.sock.ev.removeAllListeners("creds.update");
        store.sock.ev.removeAllListeners("messages.upsert");
        (store.sock as any).ws?.close();
        store.sock.end(undefined);
      } catch (e) {
        console.error(`[WhatsApp] Error cleaning up socket during force refresh:`, e);
      }
      store.sock = null;
    }
    clearAuthFolder(channelId);
    store.status = "DISCONNECTED";
    store.isInitializing = false;
  }

  // Guard 1: Ongoing initialization call in flight
  if (store.isInitializing) {
    return getWhatsAppStatus(channelId);
  }

  // Guard 2: Already connected and active
  if (store.sock && store.status === "CONNECTED") {
    return getWhatsAppStatus(channelId);
  }

  // Guard 3: Connection handshake currently in flight (< 45s) - DO NOT restart socket to avoid 440 conflict!
  if (
    !forceRefresh &&
    store.sock &&
    store.status === "CONNECTING" &&
    store.connectingStartedAt &&
    Date.now() - store.connectingStartedAt < 45000
  ) {
    return getWhatsAppStatus(channelId);
  }

  // Guard 4: QR code ready and valid
  if (
    !forceRefresh &&
    store.sock &&
    store.status === "QR_READY" &&
    store.qrCodeDataUrl &&
    store.qrGeneratedAt &&
    Date.now() - store.qrGeneratedAt < 55000
  ) {
    return getWhatsAppStatus(channelId);
  }

  // Clear any pending reconnect timer as we are initiating a connection now
  if (store.reconnectTimer) {
    clearTimeout(store.reconnectTimer);
    store.reconnectTimer = null;
  }

  // Gracefully close any stale socket and allow network buffers to clear
  if (store.sock && store.status !== "CONNECTED") {
    try {
      store.sock.ev.removeAllListeners("connection.update");
      store.sock.ev.removeAllListeners("creds.update");
      store.sock.ev.removeAllListeners("messages.upsert");
      (store.sock as any).ws?.close();
      store.sock.end(undefined);
    } catch (e) {
      console.error(`[WhatsApp] Error closing stale socket:`, e);
    }
    store.sock = null;
    // Allow brief async buffer for socket to release resources on WhatsApp server
    await new Promise((resolve) => setTimeout(resolve, 350));
  }

  store.userIntentDisconnect = false;
  store.isInitializing = true;
  store.connectingStartedAt = Date.now();
  if (store.status !== "QR_READY") {
    store.status = "CONNECTING";
  }
  store.lastError = null;

  try {
    await createAndBindWhatsAppSocket({
      channelId,
      store,
      onReconnect: (cid) => {
        initWhatsAppSocket(cid).catch((err) =>
          console.error(`[WhatsApp Reconnect Error ${store.sessionId}]:`, err)
        );
      },
    });

    store.isInitializing = false;
    return getWhatsAppStatus(channelId);
  } catch (err) {
    store.isInitializing = false;
    store.connectingStartedAt = null;
    store.status = "DISCONNECTED";
    store.lastError = err instanceof Error ? err.message : "Failed to initialize WhatsApp socket";
    console.error(`Error in initWhatsAppSocket for session ${store.sessionId}:`, err);
    return getWhatsAppStatus(channelId);
  }
}

// 24/7 Keep-Alive Monitor
if (!globalThis.__whatsapp_keepalive_timer) {
  globalThis.__whatsapp_keepalive_timer = setInterval(() => {
    for (const store of sessions.values()) {
      if (store.userIntentDisconnect) continue;

      // Send periodic presence ping for active connections to keep NAT/firewall mappings alive
      if (store.status === "CONNECTED" && store.sock) {
        try {
          store.sock.sendPresenceUpdate("available").catch(() => {});
        } catch {}
        continue;
      }

      // Auto-reconnect disconnected sessions if no pending backoff timer or ongoing connection
      if (
        hasExistingSession(store.sessionId) &&
        store.status === "DISCONNECTED" &&
        !store.sock &&
        !store.isInitializing &&
        !store.reconnectTimer
      ) {
        console.log(
          `[WhatsApp 24/7 Keep-Alive Monitor] Re-establishing connection for ${store.sessionId}...`
        );
        initWhatsAppSocket(store.sessionId).catch((err) =>
          console.error(`[WhatsApp Keep-Alive Monitor Error ${store.sessionId}]:`, err)
        );
      }
    }
  }, 15000);
}

// Auto-connect background worker for ALL existing session directories on startup
declare global {
  // eslint-disable-next-line no-var
  var __whatsapp_startup_scanned: boolean | undefined;
}

if (typeof window === "undefined" && !globalThis.__whatsapp_startup_scanned) {
  globalThis.__whatsapp_startup_scanned = true;
  setTimeout(() => {
    try {
      const waAuthBase = path.join(process.cwd(), "auth", "whatsapp");
      if (fs.existsSync(waAuthBase)) {
        const sessionDirs = fs.readdirSync(waAuthBase);
        for (const chanId of sessionDirs) {
          if (hasExistingSession(chanId)) {
            const st = getOrCreateStore(chanId);
            if (
              st.status === "DISCONNECTED" &&
              !st.userIntentDisconnect &&
              !st.isInitializing &&
              !st.sock &&
              !st.reconnectTimer
            ) {
              console.log(`[WhatsApp Startup] Auto-connecting saved session: ${chanId}`);
              initWhatsAppSocket(chanId).catch((err) =>
                console.error(`[WhatsApp Startup Error ${chanId}]:`, err)
              );
            }
          }
        }
      }
    } catch (e) {
      console.error("[WhatsApp Startup Scan Error]:", e);
    }
  }, 1000);
}


