import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestWaWebVersion,
  fetchLatestBaileysVersion,
  proto,
  Browsers,
  type CacheStore,
} from "@whiskeysockets/baileys";
import QRCode from "qrcode";
import pino from "pino";
import fs from "fs";
import {
  getAuthFolder,
  clearAuthFolder,
  msgRetryCache,
  recentMessagesMap,
  lidToPnStore,
  groupsCache,
} from "./store";
import { handleIncomingWhatsAppMessages } from "./messages";
import { getWhatsAppGroups } from "./outbound";
import type { WhatsAppStore } from "./types";

export interface CreateSocketOptions {
  channelId: string;
  store: WhatsAppStore;
  onReconnect: (channelId: string) => void;
}

let cachedWaVersion: [number, number, number] | null = null;
const FALLBACK_WA_VERSION: [number, number, number] = [2, 3000, 1047727819];

export async function createAndBindWhatsAppSocket(
  options: CreateSocketOptions
): Promise<void> {
  const { channelId, store, onReconnect } = options;
  const authFolder = getAuthFolder(channelId);

  if (!fs.existsSync(authFolder)) {
    fs.mkdirSync(authFolder, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(authFolder);
  let version = cachedWaVersion || FALLBACK_WA_VERSION;
  if (!cachedWaVersion) {
    try {
      const waVersion = await fetchLatestWaWebVersion({});
      if (waVersion?.version && Array.isArray(waVersion.version)) {
        version = waVersion.version as [number, number, number];
        cachedWaVersion = version;
      } else {
        const bVersion = await fetchLatestBaileysVersion();
        if (bVersion?.version && Array.isArray(bVersion.version)) {
          version = bVersion.version as [number, number, number];
          cachedWaVersion = version;
        }
      }
    } catch {
      console.warn(
        `[WhatsApp ${store.sessionId}] Failed to fetch latest web version, using fallback:`,
        version
      );
    }
  }

  const logger = pino({ level: "silent" });

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger,
    browser: Browsers.ubuntu("Chrome"),
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000,
    keepAliveIntervalMs: 25000,
    retryRequestDelayMs: 250,
    maxMsgRetryCount: 5,
    syncFullHistory: false,
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: false,
    msgRetryCounterCache: {
      get: <T>(key: string): T | undefined => msgRetryCache.get(key) as T | undefined,
      set: <T>(key: string, value: T): void => {
        if (typeof value === "number") {
          msgRetryCache.set(key, value);
        }
      },
      del: (key: string): void => {
        msgRetryCache.delete(key);
      },
      flushAll: (): void => {
        msgRetryCache.clear();
      },
    } satisfies CacheStore,
    shouldIgnoreJid: (jid) =>
      !jid ||
      jid === "status@broadcast" ||
      jid.endsWith("@broadcast") ||
      jid.endsWith("@newsletter"),
    patchMessageBeforeSending: (message) => {
      const requiresPatch = !!(
        message.buttonsMessage ||
        message.templateMessage ||
        message.listMessage
      );
      if (requiresPatch) {
        message = {
          viewOnceMessage: {
            message: {
              messageContextInfo: {
                deviceListMetadataVersion: 2,
                deviceListMetadata: {},
              },
              ...message,
            },
          },
        };
      }
      return message;
    },
    getMessage: async (key) => {
      if (key.id && recentMessagesMap.has(key.id)) {
        return recentMessagesMap.get(key.id) || proto.Message.fromObject({});
      }
      return proto.Message.fromObject({});
    },
  });

  store.sock = sock;

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (store.userIntentDisconnect) return;

    if (qr) {
      try {
        const now = Date.now();
        store.retryCount = 0;
        if (!store.qrCodeDataUrl) {
          const qrDataUrl = await QRCode.toDataURL(qr);
          store.qrCodeDataUrl = qrDataUrl;
          store.qrGeneratedAt = now;
          store.status = "QR_READY";
          store.isInitializing = false;

          if (store.qrTimeoutTimer) {
            clearTimeout(store.qrTimeoutTimer);
          }
          store.qrTimeoutTimer = setTimeout(() => {
            if (store.status === "QR_READY") {
              store.qrCodeDataUrl = null;
              store.qrGeneratedAt = null;
              store.status = "DISCONNECTED";
              store.isInitializing = false;
              if (store.sock) {
                try {
                  store.sock.ev.removeAllListeners("connection.update");
                  (store.sock as any).ws?.close();
                  store.sock.end(undefined);
                } catch (e) {
                  console.error(`[WhatsApp] Error closing socket during auth clear:`, e);
                }
                store.sock = null;
              }
            }
          }, 75000);
        }
      } catch (err) {
        console.error(`[WhatsApp ${store.sessionId}] Failed to generate QR code:`, err);
      }
    }

    if (connection === "open") {
      store.retryCount = 0;
      store.connectingStartedAt = null;
      store.status = "CONNECTED";
      store.qrCodeDataUrl = null;
      store.qrGeneratedAt = null;
      store.lastError = null;
      if (store.qrTimeoutTimer) {
        clearTimeout(store.qrTimeoutTimer);
        store.qrTimeoutTimer = null;
      }
      if (store.reconnectTimer) {
        clearTimeout(store.reconnectTimer);
        store.reconnectTimer = null;
      }
      const userJid = sock.user?.id || "";
      const userPhone = userJid.split(":")[0] || userJid.split("@")[0] || "";
      store.userInfo = {
        jid: userJid,
        name: sock.user?.name || "WhatsApp Account",
        phone: userPhone ? `+${userPhone}` : undefined,
      };
      console.log(`[WhatsApp ${store.sessionId}] Connection Opened for:`, userPhone);
      getWhatsAppGroups(store.sessionId, true).catch(() => {});
    }

    if (connection === "close") {
      const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
      console.log(`[WhatsApp ${store.sessionId} Close Debug]:`, statusCode, lastDisconnect?.error);

      const isLoggedOut = statusCode === DisconnectReason.loggedOut || statusCode === 401;
      const isReplaced = statusCode === DisconnectReason.connectionReplaced; // 440
      const isBadSession = statusCode === DisconnectReason.badSession;

      store.sock = null;
      store.isInitializing = false;
      store.connectingStartedAt = null;

      if (store.reconnectTimer) {
        clearTimeout(store.reconnectTimer);
        store.reconnectTimer = null;
      }

      // 1. Permanent logout (explicitly unlinked from phone) or user-intended disconnect
      if (isLoggedOut || store.userIntentDisconnect) {
        store.status = "DISCONNECTED";
        store.qrCodeDataUrl = null;
        store.qrGeneratedAt = null;
        store.retryCount = 0;
        if (store.qrTimeoutTimer) {
          clearTimeout(store.qrTimeoutTimer);
          store.qrTimeoutTimer = null;
        }
        store.userInfo = null;
        store.lastError = isLoggedOut
          ? "Logged out from phone. Please re-scan QR code."
          : null;
        console.log(
          `[WhatsApp ${store.sessionId}] Connection closed permanently (status ${
            statusCode || "unknown"
          }).`
        );
        if (isLoggedOut) {
          clearAuthFolder(channelId);
        }
        return;
      }

      // 2. Stream Conflict (440 connectionReplaced)
      if (isReplaced) {
        store.retryCount = (store.retryCount || 0) + 1;
        store.status = "CONNECTING";
        // Calculate backoff delay: 6s, 9s, 13s, up to max 25s
        const backoffMs = Math.min(
          Math.round(6000 * Math.pow(1.5, Math.min(store.retryCount - 1, 4))),
          25000
        );
        store.lastError = `Stream conflict (440): Another active session or previous connection is releasing. Reconnecting in ${Math.round(
          backoffMs / 1000
        )}s (attempt ${store.retryCount})...`;

        console.warn(
          `[WhatsApp ${store.sessionId}] Stream conflict (440). Auth credentials preserved. Scheduled reconnect in ${backoffMs}ms (attempt ${store.retryCount}).`
        );

        store.reconnectTimer = setTimeout(() => {
          store.reconnectTimer = null;
          if (!store.userIntentDisconnect && store.status !== "CONNECTED") {
            onReconnect(channelId);
          }
        }, backoffMs);
        return;
      }

      // 3. Transient Drops (408 Timeout, 428 Precondition, 500 BadSession, 515 RestartRequired, network drops)
      store.status = "CONNECTING";
      const delayMs = statusCode === DisconnectReason.restartRequired ? 1000 : 2500;
      console.log(
        `[WhatsApp ${store.sessionId}] Connection dropped (status ${
          statusCode || "unknown"
        }). Auto-reconnecting in ${delayMs}ms...`
      );

      store.reconnectTimer = setTimeout(() => {
        store.reconnectTimer = null;
        if (!store.userIntentDisconnect && store.status !== "CONNECTED") {
          onReconnect(channelId);
        }
      }, delayMs);
    }
  });

  sock.ev.on("contacts.upsert", (contacts) => {
    for (const c of contacts) {
      if (c.id) {
        const cleanId = c.id.split("@")[0].split(":")[0];
        if (c.lid) {
          const cleanLid = c.lid.split("@")[0].split(":")[0];
          lidToPnStore.set(c.lid, c.id);
          lidToPnStore.set(cleanLid, cleanId);
        }
      }
    }
  });

  sock.ev.on("contacts.update", (updates) => {
    for (const c of updates) {
      if (c.id && (c as any).lid) {
        const cleanId = c.id.split("@")[0].split(":")[0];
        const cleanLid = (c as any).lid.split("@")[0].split(":")[0];
        lidToPnStore.set((c as any).lid, c.id);
        lidToPnStore.set(cleanLid, cleanId);
      }
    }
  });

  sock.ev.on("groups.upsert", (newGroups) => {
    const cached = groupsCache.get(store.sessionId);
    const currentList = cached ? [...cached.list] : [];
    for (const g of newGroups) {
      const idx = currentList.findIndex((item) => item.id === g.id);
      const item = {
        id: g.id,
        subject: g.subject || "Unnamed Group",
        participantsCount: Array.isArray(g.participants) ? g.participants.length : 0,
      };
      if (idx >= 0) {
        currentList[idx] = item;
      } else {
        currentList.push(item);
      }
    }
    currentList.sort((a, b) => a.subject.localeCompare(b.subject, undefined, { sensitivity: "base" }));
    groupsCache.set(store.sessionId, { list: currentList, timestamp: Date.now() });
  });

  sock.ev.on("groups.update", (updates) => {
    const cached = groupsCache.get(store.sessionId);
    if (!cached) return;
    const currentList = [...cached.list];
    for (const u of updates) {
      const target = currentList.find((item) => item.id === u.id);
      if (target) {
        if (u.subject !== undefined) target.subject = u.subject;
        if (Array.isArray(u.participants)) target.participantsCount = u.participants.length;
      }
    }
    currentList.sort((a, b) => a.subject.localeCompare(b.subject, undefined, { sensitivity: "base" }));
    groupsCache.set(store.sessionId, { list: currentList, timestamp: Date.now() });
  });

  sock.ev.on("group-participants.update", async (ev) => {
    const cached = groupsCache.get(store.sessionId);
    if (cached && ev.id) {
      const target = cached.list.find((item) => item.id === ev.id);
      if (target && store.sock) {
        try {
          const meta = await store.sock.groupMetadata(ev.id);
          if (meta) {
            target.subject = meta.subject || target.subject;
            target.participantsCount = meta.participants?.length || target.participantsCount;
            groupsCache.set(store.sessionId, { list: [...cached.list], timestamp: Date.now() });
          }
        } catch {
          // ignore metadata error
        }
      }
    }
  });

  sock.ev.on("messages.upsert", async (m) => {
    if (globalThis.__whatsapp_incoming_handler) {
      await globalThis.__whatsapp_incoming_handler(store, m);
    } else {
      await handleIncomingWhatsAppMessages(store, m);
    }
  });
}
