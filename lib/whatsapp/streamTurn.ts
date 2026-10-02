import type { proto } from "@whiskeysockets/baileys";
import { forwardToChatbotStream } from "./api";
import { normalizeWhatsAppMessage } from "./parser";
import { findAndSendFileAttachments } from "./attachments";
import type { WhatsAppStore } from "./types";
import type { ChannelItem } from "../channels";

function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null;
}

function isWebMessageInfo(val: unknown): val is proto.IWebMessageInfo {
  return typeof val === "object" && val !== null && "key" in val;
}

export async function processAiResponseTurn(params: {
  store: WhatsAppStore;
  currentChannelConfig?: ChannelItem;
  promptMessageText: string;
  senderIdForApi: string;
  targetJid: string;
  pushName?: string;
  participantPhone?: string;
  isGroup: boolean;
  msg?: unknown;
}): Promise<void> {
  const {
    store,
    currentChannelConfig,
    promptMessageText,
    senderIdForApi,
    targetJid,
    pushName,
    participantPhone,
    isGroup,
    msg,
  } = params;

  if (!store.sock) return;

  const triggerComposing = () => {
    if (store.sock) {
      store.sock.sendPresenceUpdate("composing", targetJid).catch((err: unknown) => {
        console.warn(`[WhatsApp Presence Warning ${store.sessionId}]:`, err);
      });
    }
  };
  triggerComposing();
  const typingInterval = setInterval(triggerComposing, 4000);

  let sentBubbleCount = 0;
  let fallbackSent = false;
  const quotedMsg = isWebMessageInfo(msg) ? msg : undefined;

  const sendFallbackMessage = async () => {
    if (sentBubbleCount > 0 || fallbackSent || !store.sock) return;
    fallbackSent = true;
    const fallbackMsg =
      "Maaf, terjadi kendala saat memproses pesan Anda. Silakan coba beberapa saat lagi.";
    const normalizedReply = normalizeWhatsAppMessage(fallbackMsg);
    try {
      await store.sock.sendMessage(
        targetJid,
        { text: normalizedReply },
        isGroup && quotedMsg ? { quoted: quotedMsg } : undefined
      );
      console.log(
        `\n================== [RAW OUTGOING WHATSAPP FALLBACK DELIVERY - ${store.sessionId}] ==================\n` +
        `To: ${targetJid}\nText: ${normalizedReply}\n` +
        `======================================================================================\n`
      );
    } catch (sendErr: unknown) {
      console.error(`[WhatsApp Fallback Send Error ${store.sessionId}]:`, sendErr);
    }
  };

  const reqTimeoutSec =
    store.responseTimeout && store.responseTimeout > 30 ? store.responseTimeout : 120;
  const reqSessionTimeoutSec = store.sessionTimeout || 300;
  const inactivityTimeoutMs = (reqTimeoutSec + 15) * 1000;

  type StreamAbortReason = "inactivity" | "session_deadline";
  let abortReason: StreamAbortReason | null = null;

  const controller = new AbortController();
  const sessionTimeoutId = setTimeout(() => {
    abortReason = "session_deadline";
    controller.abort(
      new Error(`[WhatsApp Stream] Absolute session deadline of ${reqSessionTimeoutSec}s exceeded`)
    );
  }, reqSessionTimeoutSec * 1000);

  let inactivityTimeoutId: NodeJS.Timeout | null = null;
  const resetInactivityTimer = (): void => {
    if (inactivityTimeoutId) {
      clearTimeout(inactivityTimeoutId);
    }
    inactivityTimeoutId = setTimeout(() => {
      abortReason = "inactivity";
      controller.abort(
        new Error(`[WhatsApp Stream] Inactivity timeout reached (${inactivityTimeoutMs / 1000}s without data)`)
      );
    }, inactivityTimeoutMs);
  };

  resetInactivityTimer();

  try {
    const effectiveSystemPrompt = store.systemPrompt || currentChannelConfig?.systemPrompt || undefined;
    const effectiveModel = store.model || currentChannelConfig?.model || undefined;
    const effectiveChannelId = currentChannelConfig?.id || store.sessionId;

    const res = await forwardToChatbotStream(
      {
        message: promptMessageText,
        senderIdForApi,
        channel_id: effectiveChannelId,
        remoteJid: targetJid,
        pushName,
        participantPhone,
        isGroup,
        reqSessionTimeoutSec,
        reqTimeoutSec,
        systemPrompt: effectiveSystemPrompt,
        model: effectiveModel,
      },
      controller.signal
    );

    if (res.ok && res.body) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      const sendTurnBubble = async (rawReply: string) => {
        let replyText = rawReply.trim();
        if (!replyText) return;

        // Guard: NEVER send raw system/LLM error traces to end users on WhatsApp
        const rawErrorPatterns = [
          "Model provider", "[LLM INVOKE ERROR]", "404 Not Found", "401 Unauthorized",
          "503 Service Unavailable", "429 Too Many Requests", "AI model is not configured",
          "System initialization required", "Cannot chat:", "NOT_FOUND",
        ];
        const isRawErrorMsg = rawErrorPatterns.some((pattern) => replyText.includes(pattern));

        if (isRawErrorMsg) {
          console.warn(
            `[WhatsApp Response Guard ${store.sessionId}] Replaced raw system/error message with friendly user message.`
          );
          replyText =
            "Maaf, terjadi kendala saat memproses pesan Anda. Silakan coba beberapa saat lagi.";
        }

        if (store.sock) {
          const normalizedReply = normalizeWhatsAppMessage(replyText);
          const isFirstBubble = sentBubbleCount === 0;
          const sentMsg = await store.sock.sendMessage(
            targetJid,
            { text: normalizedReply },
            isGroup && isFirstBubble && quotedMsg ? { quoted: quotedMsg } : undefined
          );
          sentBubbleCount++;
          console.log(
            `\n================== [RAW OUTGOING WHATSAPP RESPONSE BUBBLE #${sentBubbleCount} - ${store.sessionId}] ==================\n` +
            `To: ${targetJid}\nText: ${normalizedReply}\nOutgoing Response JSON:\n` +
            JSON.stringify(
              sentMsg || { text: normalizedReply },
              (_key, value) => (typeof value === "bigint" ? value.toString() : value),
              2
            ) +
            `\n======================================================================================\n`
          );

          // Send file attachments for this turn
          await findAndSendFileAttachments(store.sock, targetJid, replyText);
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        resetInactivityTimer();
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const parsed: unknown = JSON.parse(trimmed);
            if (isRecord(parsed)) {
              if (parsed.type === "keepalive" || parsed.keepalive === true) {
                resetInactivityTimer();
                continue;
              }
              const textChunk = parsed.text ?? parsed.content ?? parsed.response ?? "";
              if (typeof textChunk === "string" && textChunk.trim()) {
                await sendTurnBubble(textChunk);
              }
            }
          } catch (e: unknown) {
            console.error(`[WhatsApp Stream JSON Parse Error ${store.sessionId}]:`, e);
          }
        }
      }

      if (inactivityTimeoutId) {
        clearTimeout(inactivityTimeoutId);
        inactivityTimeoutId = null;
      }

      // Process any leftover buffer
      if (buffer.trim()) {
        try {
          const parsed: unknown = JSON.parse(buffer.trim());
          if (isRecord(parsed)) {
            if (parsed.type !== "keepalive" && parsed.keepalive !== true) {
              const textChunk = parsed.text ?? parsed.content ?? parsed.response ?? "";
              if (typeof textChunk === "string" && textChunk.trim()) {
                await sendTurnBubble(textChunk);
              }
            }
          }
        } catch (e: unknown) {
          console.error(`[WhatsApp Stream Leftover JSON Parse Error ${store.sessionId}]:`, e);
        }
      }

      if (sentBubbleCount === 0) {
        await sendFallbackMessage();
      }
    } else {
      console.error(
        `[WhatsApp LLM Query Error ${store.sessionId}] API returned status ${res.status}`
      );
      await sendFallbackMessage();
    }
  } catch (err: unknown) {
    if (abortReason === "inactivity") {
      console.error(
        `[WhatsApp Stream Timeout ${store.sessionId}] Stream aborted due to inactivity (${inactivityTimeoutMs / 1000}s):`,
        err
      );
    } else if (abortReason === "session_deadline") {
      console.error(
        `[WhatsApp Stream Timeout ${store.sessionId}] Stream aborted due to total session deadline (${reqSessionTimeoutSec}s):`,
        err
      );
    } else {
      console.error(`Error processing WhatsApp AI response for ${store.sessionId}:`, err);
    }
    if (sentBubbleCount === 0) {
      await sendFallbackMessage();
    }
  } finally {
    if (inactivityTimeoutId) {
      clearTimeout(inactivityTimeoutId);
      inactivityTimeoutId = null;
    }
    clearTimeout(sessionTimeoutId);
    clearInterval(typingInterval);
    if (store.sock) {
      try {
        await store.sock.sendPresenceUpdate("paused", targetJid);
      } catch (err: unknown) {
        console.warn(`[WhatsApp Presence Warning ${store.sessionId}]:`, err);
      }
    }
  }
}
