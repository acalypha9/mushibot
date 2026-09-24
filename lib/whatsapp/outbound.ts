import {
  sessions,
  getOrCreateStore,
  recentMessagesMap,
  groupsCache,
  inFlightGroupFetches,
  lidToPnStore,
} from "./store";
import { normalizeWhatsAppMessage } from "./parser";
import { findAndSendFileAttachments } from "./attachments";
import type {
  WhatsAppBroadcastOptions,
  WhatsAppBroadcastResult,
  WhatsAppGroupInfo,
} from "./types";

export function normalizeWhatsAppTargetJid(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (trimmed.includes("@")) {
    const [left, right] = trimmed.split("@");
    if (right === "s.whatsapp.net") {
      let cleanDigits = left.replace(/\D/g, "");
      if (cleanDigits.startsWith("08") && cleanDigits.length >= 9) {
        cleanDigits = "62" + cleanDigits.slice(1);
      }
      return cleanDigits ? `${cleanDigits}@s.whatsapp.net` : null;
    }
    return trimmed;
  }

  // Check if it is a WhatsApp group identifier
  const isModernGroup = /^120363\d{10,20}$/.test(trimmed);
  const isLegacyGroup = /^\d{8,15}-\d{8,12}$/.test(trimmed);

  if (isModernGroup || isLegacyGroup) {
    return `${trimmed}@g.us`;
  }

  // Otherwise, it is a personal phone number recipient
  let cleanDigits = trimmed.replace(/\D/g, "");
  if (!cleanDigits) return null;

  if (cleanDigits.startsWith("08") && cleanDigits.length >= 9) {
    cleanDigits = "62" + cleanDigits.slice(1);
  }

  return `${cleanDigits}@s.whatsapp.net`;
}

export async function sendWhatsAppBroadcast(
  channelId: string = "default",
  recipients: string[] = [],
  text: string = "",
  options?: WhatsAppBroadcastOptions
): Promise<WhatsAppBroadcastResult> {
  let store = getOrCreateStore(channelId);
  if (!store.sock || store.status !== "CONNECTED") {
    for (const s of sessions.values()) {
      if (s.sock && s.status === "CONNECTED") {
        store = s;
        break;
      }
    }
  }

  if (!store.sock || store.status !== "CONNECTED") {
    throw new Error(`WhatsApp socket for session ${store.sessionId} is not connected.`);
  }

  let sentCount = 0;
  const errors: string[] = [];
  const blList = (options?.blacklist || []).map((b) => b.trim().toLowerCase()).filter(Boolean);
  const allowPrivate = options?.allowPrivate ?? true;
  const allowGroup = options?.allowGroup ?? true;

  // Resolve target JID list
  const targetJids: string[] = [];

  for (const raw of recipients) {
    const rawUpper = raw.trim().toUpperCase();
    if (rawUpper === "ALL" || rawUpper.startsWith("ALL")) {
      // If ALL is requested, fetch all joined groups if allowGroup is true
      if (allowGroup) {
        try {
          const groupsMap = await store.sock.groupFetchAllParticipating();
          for (const gId of Object.keys(groupsMap)) {
            if (!targetJids.includes(gId)) {
              targetJids.push(gId);
            }
          }
        } catch (err) {
          console.error(`[WhatsApp Broadcast] Failed to fetch groups for ALL broadcast:`, err);
        }
      }
    } else if (rawUpper !== "DEFAULT") {
      const normalizedJid = normalizeWhatsAppTargetJid(raw);
      if (normalizedJid && !targetJids.includes(normalizedJid)) {
        targetJids.push(normalizedJid);
      }
    }
  }

  if (targetJids.length === 0) {
    return { success: false, sentCount: 0, errors: ["No valid target recipients found."] };
  }

  for (const jid of targetJids) {
    try {
      const isGroupJid = jid.endsWith("@g.us");
      if (isGroupJid && !allowGroup) {
        continue;
      }
      if (!isGroupJid && !allowPrivate) {
        continue;
      }

      // Check blacklist
      const jidLower = jid.toLowerCase();
      const cleanDigits = jidLower.replace(/[^\d]/g, "");
      const isBl = blList.some((bl) => {
        const cleanBl = bl.replace(/[^\d]/g, "");
        return (
          bl === jidLower ||
          (cleanBl && cleanDigits && cleanBl === cleanDigits) ||
          (jidLower.includes(bl) && bl.length > 5)
        );
      });

      if (isBl) {
        continue;
      }

      const normalizedText = normalizeWhatsAppMessage(text);
      const sentMsg = await store.sock.sendMessage(jid, { text: normalizedText });
      if (sentMsg?.key?.id && sentMsg.message) {
        recentMessagesMap.set(sentMsg.key.id, sentMsg.message);
      }
      sentCount++;

      // Auto-detect and send referenced file attachments
      await findAndSendFileAttachments(store.sock, jid, text);
    } catch (err) {
      errors.push(`Failed to send to ${jid}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { success: sentCount > 0, sentCount, errors };
}

export async function getWhatsAppGroups(
  channelId: string = "default",
  forceRefresh: boolean = false
): Promise<WhatsAppGroupInfo[]> {
  const store = getOrCreateStore(channelId);

  const cached = groupsCache.get(store.sessionId);
  const now = Date.now();

  // Return cached result if available and fresh (< 2 minutes old) unless forceRefresh is true
  if (!forceRefresh && cached && now - cached.timestamp < 120000) {
    return cached.list;
  }

  if (!store.sock || store.status !== "CONNECTED") {
    return cached?.list || [];
  }

  // Deduplicate concurrent in-flight requests for the same session
  if (inFlightGroupFetches.has(store.sessionId)) {
    return inFlightGroupFetches.get(store.sessionId)!;
  }

  const fetchPromise = (async () => {
    try {
      const groupsMap = await store.sock!.groupFetchAllParticipating();
      const list = Object.values(groupsMap).map((g: any) => {
        if (Array.isArray(g.participants)) {
          for (const p of g.participants) {
            let pPhone = "";
            let pLid = "";

            if (p.id?.endsWith("@s.whatsapp.net")) pPhone = p.id;
            else if (p.id?.endsWith("@lid")) pLid = p.id;

            if (p.lid?.endsWith("@lid")) pLid = p.lid;
            if (p.jid?.endsWith("@s.whatsapp.net")) pPhone = p.jid;
            if (p.phoneNumber) {
              const numDigits = String(p.phoneNumber).replace(/\D/g, "");
              if (numDigits.length >= 8) pPhone = `${numDigits}@s.whatsapp.net`;
            }

            if (pPhone && pLid) {
              const cleanLid = pLid.split("@")[0].split(":")[0];
              lidToPnStore.set(pLid, pPhone);
              lidToPnStore.set(cleanLid, pPhone);
              lidToPnStore.set(`${cleanLid}@lid`, pPhone);
            }
          }
        }

        return {
          id: g.id,
          subject: g.subject || "Unnamed Group",
          participantsCount: Array.isArray(g.participants) ? g.participants.length : 0,
        };
      });
      list.sort((a, b) => a.subject.localeCompare(b.subject, undefined, { sensitivity: "base" }));
      groupsCache.set(store.sessionId, { list, timestamp: Date.now() });
      return list;
    } catch (err: any) {
      const isRateLimit =
        err?.data === 429 ||
        err?.message?.includes("rate-overlimit") ||
        err?.output?.statusCode === 429;
      if (isRateLimit) {
        console.warn(
          `[WhatsApp ${store.sessionId}] Rate limit reached on groupFetchAllParticipating. Gracefully returning cached groups (${
            cached?.list?.length || 0
          } groups).`
        );
      } else {
        console.error(`[WhatsApp ${store.sessionId}] Failed to fetch groups:`, err?.message || err);
      }
      return cached?.list || [];
    } finally {
      inFlightGroupFetches.delete(store.sessionId);
    }
  })();

  inFlightGroupFetches.set(store.sessionId, fetchPromise);
  return fetchPromise;
}

export async function sendDirectMessage(
  channelId: string = "default",
  jid: string = "",
  text: string = ""
): Promise<boolean> {
  let store = getOrCreateStore(channelId);
  if (!store.sock || store.status !== "CONNECTED") {
    for (const s of sessions.values()) {
      if (s.sock && s.status === "CONNECTED") {
        store = s;
        break;
      }
    }
  }
  if (!store.sock || !jid || !text) return false;
  try {
    const targetJid = normalizeWhatsAppTargetJid(jid) || jid.trim();
    if (!targetJid) return false;
    const normalizedReply = normalizeWhatsAppMessage(text);
    await store.sock.sendMessage(targetJid, { text: normalizedReply });

    // Auto-detect and send referenced file attachments
    await findAndSendFileAttachments(store.sock, targetJid, text);
    return true;
  } catch (err) {
    console.error(`[WhatsApp Direct Push Error ${store.sessionId}] To ${jid}:`, err);
    return false;
  }
}
