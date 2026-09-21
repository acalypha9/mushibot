import {
  recentMessagesMap,
  lidToPnStore,
} from "./store";
import { loadPersistedChannels } from "../channels";
import type { WhatsAppStore } from "./types";
import { extractMessageText } from "./parser";
import { resolveInboundSender, evaluateInboundPolicy } from "./inboundPolicy";
import { processAiResponseTurn } from "./streamTurn";

export * from "./parser";
export * from "./attachments";
export * from "./outbound";
export * from "./inboundPolicy";
export * from "./streamTurn";

export async function handleIncomingWhatsAppMessages(store: WhatsAppStore, m: any) {
  if (!store.sock) return;
  const sock = store.sock;

  console.log(
    `[WhatsApp ${store.sessionId}] messages.upsert received ${m.messages?.length || 0} msg(s), type=${m.type}`
  );
  for (const msg of m.messages) {
    if (msg.key.id && msg.message) {
      recentMessagesMap.set(msg.key.id, msg.message);
      if (recentMessagesMap.size > 2000) {
        const oldestKey = recentMessagesMap.keys().next().value;
        if (oldestKey) recentMessagesMap.delete(oldestKey);
      }
    }
    if (!msg.message) continue;

    const rawRemoteJid = msg.key.remoteJid;
    if (!rawRemoteJid) continue;

    const isGroup = rawRemoteJid.endsWith("@g.us");

    const isSelfMessage = msg.key.fromMe;
    const selfNumber = sock.user?.id?.split("@")[0].split(":")[0] || "";
    const isSelfChat =
      isSelfMessage && (rawRemoteJid.includes(selfNumber) || rawRemoteJid.startsWith(selfNumber));
    if (isSelfMessage && !isSelfChat) continue;

    const { effectiveSenderJid, targetJid, senderIdForApi, participantJid, participantPn } =
      await resolveInboundSender(rawRemoteJid, isGroup, msg, lidToPnStore, sock);

    const textContent = extractMessageText(msg.message);
    if (!textContent.trim()) continue;

    if (process.env.LOG_RAW_MESSAGE_IO === "true") {
      console.log(
        `\n================== [RAW INCOMING WHATSAPP MESSAGE DEBUG - ${store.sessionId}] ==================`
      );
      console.log(
        `From: ${rawRemoteJid} (isGroup: ${isGroup}) | Participant: ${participantPn || participantJid || "N/A"} | EffectiveSender: ${effectiveSenderJid} | ApiSender: ${senderIdForApi}`
      );
      console.log(`Text: ${textContent}`);
      console.log("Incoming Message JSON:");
      console.log(
        JSON.stringify(
          msg,
          (key, value) => (typeof value === "bigint" ? value.toString() : value),
          2
        )
      );
      console.log(
        `======================================================================================\n`
      );
    }

    // Access Control Check (Whitelist, Blacklist, Reply All)
    const allPersistedChannels = loadPersistedChannels();
    let currentChannelConfig = allPersistedChannels.find((c) => c.id === store.sessionId);
    if (
      !currentChannelConfig &&
      (store.sessionId === "default" ||
        store.sessionId.startsWith("channel-") ||
        allPersistedChannels.filter((c) => c.type === "WHATSAPP").length === 1)
    ) {
      currentChannelConfig = allPersistedChannels.find((c) => c.type === "WHATSAPP");
    }

    if (currentChannelConfig && typeof currentChannelConfig.autoReplyEnabled === "boolean") {
      store.autoReplyEnabled = currentChannelConfig.autoReplyEnabled;
    }

    if (!store.autoReplyEnabled) {
      console.log(`[WhatsApp AutoReply Session ${store.sessionId}] Auto-reply is DISABLED. Skipping.`);
      continue;
    }

    const policy = evaluateInboundPolicy({
      store,
      currentChannelConfig,
      isGroup,
      rawRemoteJid,
      targetJid,
      senderIdForApi,
      participantJid,
      participantPn,
      textContent,
    });

    if (!policy.allowed) {
      console.log(`[WhatsApp Access Control - ${store.sessionId}] Ignored: ${policy.reason}`);
      continue;
    }

    const promptMessageText = policy.promptMessageText || textContent;

    if (store.sock) {
      await processAiResponseTurn({
        store,
        currentChannelConfig,
        promptMessageText,
        senderIdForApi,
        targetJid,
        pushName: msg.pushName,
        participantPhone: participantPn,
        isGroup,
        msg,
      });
    }
  }
}

globalThis.__whatsapp_incoming_handler = handleIncomingWhatsAppMessages;
