export interface ForwardChannelQueryParams {
  message: string;
  senderIdForApi: string;
  channel_id?: string | null;
  remoteJid?: string | null;
  pushName?: string;
  participantPhone?: string;
  isGroup: boolean;
  reqSessionTimeoutSec: number;
  reqTimeoutSec: number;
  systemPrompt?: string | null;
  model?: string | null;
}

export async function forwardToChatbotStream(
  params: ForwardChannelQueryParams,
  signal: AbortSignal
): Promise<Response> {
  const {
    message,
    senderIdForApi,
    channel_id,
    remoteJid,
    pushName,
    participantPhone,
    isGroup,
    reqSessionTimeoutSec,
    reqTimeoutSec,
    systemPrompt,
    model,
  } = params;

  const internalToken =
    process.env.INTERNAL_API_KEY ||
    process.env.INTERNAL_API_SECRET ||
    process.env.JWT_SECRET;

  return fetch(`${process.env.API_INTERNAL_URL ?? "http://127.0.0.1:8080"}/api/chat/channel-query-stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(internalToken ? { "X-Internal-Token": internalToken } : {}),
    },
    signal,
    body: JSON.stringify({
      message,
      channel: "WHATSAPP",
      channel_id: channel_id || undefined,
      sender_id: senderIdForApi,
      remote_jid: remoteJid || undefined,
      push_name: pushName || (isGroup ? "WhatsApp Group Member" : undefined),
      participant_phone: participantPhone || undefined,
      session_timeout: reqSessionTimeoutSec,
      response_timeout: reqTimeoutSec,
      system_prompt: systemPrompt || undefined,
      model: model || undefined,
    }),
  });
}
