import { forwardToChatbotStream } from "./api";
import { normalizeWhatsAppMessage } from "./parser";
import { findAndSendFileAttachments } from "./attachments";
import type { WhatsAppStore } from "./types";
import type { ChannelItem } from "../channels";

export async function processAiResponseTurn(params: {
  store: WhatsAppStore;
  currentChannelConfig?: ChannelItem;
  promptMessageText: string;
  senderIdForApi: string;
  targetJid: string;
  pushName?: string;
  participantPhone?: string;
  isGroup: boolean;
  msg: any;
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

  // Immediately trigger typing state for the chat
  store.sock.sendPresenceUpdate("composing", targetJid).catch((err: any) => {
    console.warn(`[WhatsApp Presence Warning ${store.sessionId}]:`, err);
  });

  // Keep typing state active every 4 seconds while AI is thinking and streaming
  const typingInterval = setInterval(() => {
    if (store.sock) {
      store.sock.sendPresenceUpdate("composing", targetJid).catch(() => {});
    }
  }, 4000);

  try {
    const reqTimeoutSec =
      store.responseTimeout && store.responseTimeout > 30 ? store.responseTimeout : 120;
    const reqSessionTimeoutSec = store.sessionTimeout || 300;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), (reqTimeoutSec + 15) * 1000);

    const effectiveSystemPrompt = store.systemPrompt || currentChannelConfig?.systemPrompt || undefined;
    const effectiveModel = store.model || currentChannelConfig?.model || undefined;

    const res = await forwardToChatbotStream(
      {
        message: promptMessageText,
        senderIdForApi,
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
    clearTimeout(timeoutId);

    if (res.ok && res.body) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let sentBubbleCount = 0;

      const sendTurnBubble = async (rawReply: string) => {
        let replyText = rawReply.trim();
        if (!replyText) return;

        // Guard: NEVER send raw system/LLM error traces to end users on WhatsApp
        const isRawErrorMsg =
          replyText.includes("Model provider") ||
          replyText.includes("[LLM INVOKE ERROR]") ||
          replyText.includes("404 Not Found") ||
          replyText.includes("401 Unauthorized") ||
          replyText.includes("503 Service Unavailable") ||
          replyText.includes("429 Too Many Requests") ||
          replyText.includes("AI model is not configured") ||
          replyText.includes("System initialization required") ||
          replyText.includes("Cannot chat:") ||
          replyText.includes("NOT_FOUND");

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
            isGroup && isFirstBubble ? { quoted: msg } : undefined
          );
          sentBubbleCount++;
          console.log(
            `\n================== [RAW OUTGOING WHATSAPP RESPONSE BUBBLE #${sentBubbleCount} - ${store.sessionId}] ==================`
          );
          console.log(`To: ${targetJid}`);
          console.log(`Text: ${normalizedReply}`);
          console.log("Outgoing Response JSON:");
          console.log(
            JSON.stringify(
              sentMsg || { text: normalizedReply },
              (key, value) => (typeof value === "bigint" ? value.toString() : value),
              2
            )
          );
          console.log(
            `======================================================================================\n`
          );

          // Send file attachments for this turn
          await findAndSendFileAttachments(store.sock, targetJid, replyText);
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const parsed = JSON.parse(trimmed);
            const textChunk = parsed.text || parsed.content || parsed.response || "";
            if (textChunk && typeof textChunk === "string") {
              await sendTurnBubble(textChunk);
            }
          } catch (e) {
            console.error(`[WhatsApp Stream JSON Parse Error ${store.sessionId}]:`, e);
          }
        }
      }

      // Process any leftover buffer
      if (buffer.trim()) {
        try {
          const parsed = JSON.parse(buffer.trim());
          const textChunk = parsed.text || parsed.content || parsed.response || "";
          if (textChunk && typeof textChunk === "string") {
            await sendTurnBubble(textChunk);
          }
        } catch (e) {}
      }

      if (sentBubbleCount === 0 && store.sock) {
        const fallbackMsg =
          "Maaf, terjadi kendala saat memproses pesan Anda. Silakan coba beberapa saat lagi.";
        const normalizedReply = normalizeWhatsAppMessage(fallbackMsg);
        await store.sock.sendMessage(
          targetJid,
          { text: normalizedReply },
          isGroup ? { quoted: msg } : undefined
        );
      }
    } else {
      console.error(
        `[WhatsApp LLM Query Error ${store.sessionId}] API returned status ${res.status}`
      );
      const fallbackMsg =
        "Maaf, terjadi kendala saat memproses pesan Anda. Silakan coba beberapa saat lagi.";
      if (store.sock) {
        const normalizedReply = normalizeWhatsAppMessage(fallbackMsg);
        await store.sock.sendMessage(
          targetJid,
          { text: normalizedReply },
          isGroup ? { quoted: msg } : undefined
        );
      }
    }
  } catch (err) {
    console.error(`Error processing WhatsApp AI response for ${store.sessionId}:`, err);
  } finally {
    clearInterval(typingInterval);
    if (store.sock) {
      store.sock.sendPresenceUpdate("paused", targetJid).catch(() => {});
    }
  }
}
