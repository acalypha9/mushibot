import {
  jidDecode,
  isJidGroup,
  proto,
  type SignalDataSet,
} from "@whiskeysockets/baileys";

export const SIGNAL_FUTURE_COUNTER_DRIFT_FRAGMENT =
  "Over 2000 messages into the future";

export interface SignalSessionKeyStore {
  set(data: SignalDataSet): Promise<void> | void;
}

export interface SignalRecoveryAuthState {
  keys?: SignalSessionKeyStore;
}

export interface SignalRecoverySocket {
  authState?: SignalRecoveryAuthState;
}

export interface SignalRecoveryResult {
  recovered: boolean;
  sessionKey?: string;
  senderJid?: string;
}

/**
 * Checks whether an incoming message is a CIPHERTEXT stub caused by Signal future-counter drift.
 */
export function isFutureCounterDriftMessage(
  msg: proto.IWebMessageInfo | null | undefined
): boolean {
  if (!msg) {
    return false;
  }

  const isCiphertextStub =
    msg.messageStubType === proto.WebMessageInfo.StubType.CIPHERTEXT;
  if (!isCiphertextStub) {
    return false;
  }

  const params = msg.messageStubParameters;
  if (!Array.isArray(params)) {
    return false;
  }

  return params.some(
    (param) =>
      typeof param === "string" &&
      param.includes(SIGNAL_FUTURE_COUNTER_DRIFT_FRAGMENT)
  );
}

/**
 * Derives the affected sender JID from a message key.
 * For group chats (@g.us), the affected session belongs to key.participant.
 * For direct 1-on-1 chats, the affected session belongs to key.remoteJid.
 */
export function deriveAffectedSenderJid(
  key: proto.IMessageKey | null | undefined
): string | null {
  if (!key) {
    return null;
  }

  const remoteJid = key.remoteJid;
  if (!remoteJid || typeof remoteJid !== "string" || !remoteJid.trim()) {
    return null;
  }

  const isGroup = remoteJid.endsWith("@g.us") || isJidGroup(remoteJid) === true;
  if (isGroup) {
    const participant = key.participant;
    if (!participant || typeof participant !== "string" || !participant.trim()) {
      return null;
    }
    return participant.trim();
  }

  return remoteJid.trim();
}

/**
 * Derives the Signal session key matching Baileys libsignal storage convention: `<user>.<device>`.
 * Direct standard JID `628123456789@s.whatsapp.net` => `628123456789.0`
 * Group participant JID `628987654321:1@s.whatsapp.net` => `628987654321.1`
 */
export function deriveSignalSessionKey(
  jid: string | null | undefined
): string | null {
  if (!jid || typeof jid !== "string" || !jid.trim()) {
    return null;
  }

  const decoded = jidDecode(jid.trim());
  if (!decoded || !decoded.user || !decoded.user.trim()) {
    return null;
  }

  const deviceId =
    typeof decoded.device === "number" && !Number.isNaN(decoded.device)
      ? decoded.device
      : 0;

  return `${decoded.user}.${deviceId}`;
}

/**
 * Recovers from Signal future-counter drift by removing ONLY the affected sender's
 * session key from the live Baileys authState key store.
 * Never clears the channel auth directory or credentials.
 */
export async function recoverSignalFutureCounter(
  sock: SignalRecoverySocket | null | undefined,
  msg: proto.IWebMessageInfo | null | undefined,
  sessionId?: string
): Promise<SignalRecoveryResult> {
  if (!isFutureCounterDriftMessage(msg)) {
    return { recovered: false };
  }

  if (!msg?.key) {
    return { recovered: false };
  }

  const senderJid = deriveAffectedSenderJid(msg.key);
  if (!senderJid) {
    return { recovered: false };
  }

  const sessionKey = deriveSignalSessionKey(senderJid);
  if (!sessionKey) {
    return { recovered: false };
  }

  const keyStore = sock?.authState?.keys;
  if (!keyStore || typeof keyStore.set !== "function") {
    return { recovered: false };
  }

  try {
    await keyStore.set({
      session: {
        [sessionKey]: null,
      },
    });

    console.warn(
      `[WhatsApp ${sessionId || "default"}] Reset Signal session due to future counter drift`
    );

    return {
      recovered: true,
      sessionKey,
      senderJid,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      `[WhatsApp ${sessionId || "default"}] Failed to reset Signal session: ${message}`
    );
    return { recovered: false };
  }
}
