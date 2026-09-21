import fs from "fs";
import { getConfigFile } from "./store";
import { validateCommandPrefix } from "./parser";
import type { WhatsAppStore } from "./types";
import type { ChannelItem } from "../channels";

export interface ResolvedInboundSender {
  effectiveSenderJid: string;
  targetJid: string;
  senderIdForApi: string;
  participantJid?: string;
  participantPn?: string;
}

export function normalizePhoneDigits(input?: string): string {
  if (!input) return "";
  let d = input.replace(/\D/g, "");
  if (d.startsWith("08") && d.length >= 9) {
    d = "62" + d.slice(1);
  }
  return d;
}

export function isSenderAuthorized(
  entry: string,
  jid?: string,
  pn?: string
): boolean {
  if (!entry) return false;
  const entryLower = entry.trim().toLowerCase();
  const jidLower = (jid || "").trim().toLowerCase();
  const pnLower = (pn || "").trim().toLowerCase();

  // 1. Exact string match
  if (entryLower === jidLower || (pnLower && entryLower === pnLower)) {
    return true;
  }

  // 2. Substring match
  if (
    jidLower &&
    entryLower.length > 5 &&
    (jidLower.includes(entryLower) || entryLower.includes(jidLower))
  ) {
    return true;
  }

  // 3. Digit-based comparison with 08 <-> 62 normalization
  const entryDigits = normalizePhoneDigits(entryLower);
  const jidDigits = normalizePhoneDigits(jidLower);
  const pnDigits = normalizePhoneDigits(pnLower);

  if (entryDigits.length >= 7) {
    if (jidDigits && entryDigits === jidDigits) return true;
    if (pnDigits && entryDigits === pnDigits) return true;

    // National number comparison
    const getNational = (s: string) => {
      if (s.startsWith("62") && s.length >= 9) return s.slice(2);
      if (s.startsWith("0") && s.length >= 9) return s.slice(1);
      return s;
    };

    const entryNat = getNational(entryDigits);
    const jidNat = getNational(jidDigits);
    const pnNat = getNational(pnDigits);

    if (entryNat.length >= 7) {
      if (jidNat && entryNat === jidNat) return true;
      if (pnNat && entryNat === pnNat) return true;
    }
  }

  return false;
}

function findPhoneJidInObject(obj: any): string | undefined {
  if (!obj || typeof obj !== "object") return undefined;

  const directCandidates = [
    obj.participantPn,
    obj.remoteJidAlt,
    obj.key?.participantPn,
    obj.key?.remoteJidAlt,
    obj.message?.extendedTextMessage?.contextInfo?.participantPn,
    obj.message?.extendedTextMessage?.contextInfo?.remoteJidAlt,
    obj.participant,
    obj.key?.participant,
    obj.author,
  ];

  for (const c of directCandidates) {
    if (typeof c === "string" && c.endsWith("@s.whatsapp.net") && !c.includes("@g.us")) {
      return c;
    }
  }

  // Scan key object keys
  if (obj.key && typeof obj.key === "object") {
    for (const k of Object.keys(obj.key)) {
      const val = obj.key[k];
      if (typeof val === "string" && val.endsWith("@s.whatsapp.net") && !val.includes("@g.us")) {
        return val;
      }
    }
  }

  // Scan root object keys
  for (const k of Object.keys(obj)) {
    const val = obj[k];
    if (typeof val === "string" && val.endsWith("@s.whatsapp.net") && !val.includes("@g.us")) {
      return val;
    }
  }

  return undefined;
}

function findLidInObject(obj: any): string | undefined {
  if (!obj || typeof obj !== "object") return undefined;

  const directCandidates = [
    obj.key?.participant,
    obj.participant,
    obj.key?.remoteJid,
    obj.remoteJid,
    obj.author,
    obj.message?.extendedTextMessage?.contextInfo?.participant,
  ];

  for (const c of directCandidates) {
    if (typeof c === "string" && c.includes("@lid")) {
      return c;
    }
  }

  return undefined;
}

export async function resolveInboundSender(
  rawRemoteJid: string,
  isGroup: boolean,
  msg: any,
  lidToPnStore: Map<string, string>,
  sock?: any
): Promise<ResolvedInboundSender> {
  let effectiveSenderJid = rawRemoteJid;
  let targetJid = rawRemoteJid;
  let senderIdForApi = rawRemoteJid;
  let participantJid: string | undefined = undefined;
  let participantPn: string | undefined = undefined;

  if (isGroup) {
    targetJid = rawRemoteJid;
    senderIdForApi = rawRemoteJid;

    // 1. Prioritize real phone number (@s.whatsapp.net) from the message
    let phoneJid = findPhoneJidInObject(msg);
    const foundLid = findLidInObject(msg);

    // If an LID and a phone number are both present, learn the mapping immediately
    if (foundLid && phoneJid) {
      const cleanLid = foundLid.split("@")[0].split(":")[0];
      lidToPnStore.set(foundLid, phoneJid);
      lidToPnStore.set(cleanLid, phoneJid);
      lidToPnStore.set(`${cleanLid}@lid`, phoneJid);
    }

    // 2. If phone number wasn't found directly, try lidToPnStore cache
    if (!phoneJid && foundLid) {
      const cleanLid = foundLid.split("@")[0].split(":")[0];
      const mapped = lidToPnStore.get(foundLid) || lidToPnStore.get(cleanLid);
      if (mapped && mapped.endsWith("@s.whatsapp.net") && !mapped.includes("@lid")) {
        phoneJid = mapped;
      }
    }

    // 3. If still unresolved and socket is available, query groupMetadata to populate cache
    if (!phoneJid && foundLid && sock && typeof sock.groupMetadata === "function") {
      try {
        const meta = await sock.groupMetadata(rawRemoteJid);
        if (meta && Array.isArray(meta.participants)) {
          const cleanTargetLid = foundLid ? foundLid.split("@")[0].split(":")[0] : "";
          for (const p of meta.participants) {
            let pPhone = "";
            let pLid = "";

            if (p.id?.endsWith("@s.whatsapp.net")) pPhone = p.id;
            else if (p.id?.endsWith("@lid")) pLid = p.id;

            if ((p as any).lid?.endsWith("@lid")) pLid = (p as any).lid;
            if ((p as any).jid?.endsWith("@s.whatsapp.net")) pPhone = (p as any).jid;
            if ((p as any).phoneNumber) {
              const numDigits = String((p as any).phoneNumber).replace(/\D/g, "");
              if (numDigits.length >= 8) pPhone = `${numDigits}@s.whatsapp.net`;
            }

            if (pPhone && pLid) {
              const cleanLid = pLid.split("@")[0].split(":")[0];
              lidToPnStore.set(pLid, pPhone);
              lidToPnStore.set(cleanLid, pPhone);
              lidToPnStore.set(`${cleanLid}@lid`, pPhone);
              if (pLid === foundLid || cleanLid === cleanTargetLid) {
                phoneJid = pPhone;
              }
            }
          }
        }
      } catch (err) {
        console.warn(`[resolveInboundSender] Failed to fetch group metadata for ${rawRemoteJid}:`, err);
      }
    }

    // Resolved participant identifier: either phone number JID or fallback to LID/raw
    const resolved = phoneJid || foundLid || (msg.key as any)?.participant || "";
    participantJid = resolved;
    effectiveSenderJid = resolved;

    if (phoneJid && phoneJid.endsWith("@s.whatsapp.net")) {
      const cleanDigits = phoneJid.split("@")[0].split(":")[0].replace(/\D/g, "");
      if (cleanDigits.length >= 8) {
        participantPn = `+${cleanDigits}`;
      }
    } else if (resolved && !resolved.includes("@lid") && !resolved.endsWith("@lid")) {
      const cleanDigits = resolved.split("@")[0].split(":")[0].replace(/\D/g, "");
      if (cleanDigits.length >= 8 && cleanDigits.length <= 15) {
        participantPn = `+${cleanDigits}`;
      }
    }
  } else {
    // 1-on-1 private chat
    let phoneJid = findPhoneJidInObject(msg);
    const isLidChat = rawRemoteJid.endsWith("@lid") || rawRemoteJid.includes("@lid");

    if (isLidChat) {
      const cleanLid = rawRemoteJid.split("@")[0].split(":")[0];
      if (phoneJid) {
        lidToPnStore.set(rawRemoteJid, phoneJid);
        lidToPnStore.set(cleanLid, phoneJid);
      } else {
        const mapped = lidToPnStore.get(rawRemoteJid) || lidToPnStore.get(cleanLid);
        if (mapped && mapped.endsWith("@s.whatsapp.net") && !mapped.includes("@lid")) {
          phoneJid = mapped;
        }
      }
    }

    effectiveSenderJid = phoneJid || rawRemoteJid;
    targetJid = rawRemoteJid;

    const cleanNumber = effectiveSenderJid.split("@")[0].split(":")[0].replace(/\D/g, "");
    if (cleanNumber.length >= 8) {
      senderIdForApi = `+${cleanNumber}`;
    } else {
      senderIdForApi = effectiveSenderJid;
    }

    participantJid = effectiveSenderJid;
    participantPn = senderIdForApi;
  }

  return { effectiveSenderJid, targetJid, senderIdForApi, participantJid, participantPn };
}

export interface InboundPolicyResult {
  allowed: boolean;
  reason?: string;
  promptMessageText?: string;
}

export function evaluateInboundPolicy(params: {
  store: WhatsAppStore;
  currentChannelConfig?: ChannelItem;
  isGroup: boolean;
  rawRemoteJid: string;
  targetJid: string;
  senderIdForApi: string;
  participantJid?: string;
  participantPn?: string;
  textContent: string;
}): InboundPolicyResult {
  const {
    store,
    currentChannelConfig,
    isGroup,
    rawRemoteJid,
    targetJid,
    senderIdForApi,
    participantJid,
    participantPn,
    textContent,
  } = params;

  if (currentChannelConfig) {
    if (currentChannelConfig.autoReplyEnabled === false) {
      return {
        allowed: false,
        reason: `Channel ${currentChannelConfig.name} auto-reply is DISABLED.`,
      };
    }

    const allowPrivate = currentChannelConfig.allowPrivate ?? true;
    const allowGroup = currentChannelConfig.allowGroup ?? true;

    if (isGroup && !allowGroup) {
      return {
        allowed: false,
        reason: `Group message received from ${rawRemoteJid} but Group reply is DISABLED.`,
      };
    }

    if (!isGroup && !allowPrivate) {
      return {
        allowed: false,
        reason: `Private message received from ${rawRemoteJid} but Private reply is DISABLED.`,
      };
    }

    const rawBl = currentChannelConfig.blacklist || "";
    const blList = rawBl.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

    const rawJidLower = rawRemoteJid.toLowerCase();
    const targetJidLower = targetJid.toLowerCase();

    if (blList.length > 0) {
      const isBlacklisted = blList.some((bl) => {
        if (isGroup) {
          // Check if group itself is blacklisted
          const isGroupBl =
            bl === rawJidLower ||
            bl === targetJidLower ||
            (rawJidLower.includes(bl) && bl.length > 5) ||
            (targetJidLower.includes(bl) && bl.length > 5);
          if (isGroupBl) return true;

          // Check if participant is blacklisted
          return isSenderAuthorized(bl, participantJid, participantPn);
        } else {
          return (
            isSenderAuthorized(bl, rawRemoteJid, senderIdForApi) ||
            isSenderAuthorized(bl, targetJid, participantPn)
          );
        }
      });

      if (isBlacklisted) {
        return {
          allowed: false,
          reason: isGroup
            ? `Sender ${participantPn || participantJid || senderIdForApi} or Group ${rawRemoteJid} is in BLACKLIST.`
            : `Sender ${senderIdForApi} (${rawRemoteJid}) is in BLACKLIST.`,
        };
      }
    }

    const isReplyAll =
      (currentChannelConfig.replyMode || "all") === "all" &&
      !currentChannelConfig.whitelist?.trim();
    if (!isReplyAll) {
      const rawWl = currentChannelConfig.whitelist || "";
      const wlList = rawWl.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

      if (wlList.length === 0) {
        return {
          allowed: false,
          reason: `replyMode is 'specific' (Whitelist Only) but Whitelist is EMPTY (0 recipients).`,
        };
      }

      // Group entries
      const groupWl = wlList.filter(
        (wl) => wl.includes("@g.us") || (wl.startsWith("120363") && wl.length > 15)
      );
      // User entries
      const userWl = wlList.filter(
        (wl) => !wl.includes("@g.us") && !(wl.startsWith("120363") && wl.length > 15)
      );

      if (isGroup) {
        // 1. Group authorization: If any group entries exist in whitelist, this group MUST match
        if (groupWl.length > 0) {
          const isGroupAllowed = groupWl.some((gw) => {
            const cleanGw = gw.replace(/[^\d]/g, "");
            const cleanRawDigits = rawJidLower.replace(/[^\d]/g, "");
            return (
              gw === rawJidLower ||
              gw === targetJidLower ||
              (cleanGw && cleanRawDigits && cleanGw === cleanRawDigits) ||
              (rawJidLower.includes(gw) && gw.length > 5) ||
              (targetJidLower.includes(gw) && gw.length > 5)
            );
          });

          if (!isGroupAllowed) {
            return {
              allowed: false,
              reason: `Group ${rawRemoteJid} is NOT in WHITELIST.`,
            };
          }
        }

        // 2. Participant authorization: The participant MUST match an allowed user in the whitelist
        const isUserAllowed =
          userWl.length > 0 &&
          userWl.some((uw) => isSenderAuthorized(uw, participantJid, participantPn));

        if (!isUserAllowed) {
          return {
            allowed: false,
            reason: `Participant ${participantPn || participantJid || "Unknown"} in group ${rawRemoteJid} is NOT in WHITELIST.`,
          };
        }
      } else {
        // Private 1-on-1 chat authorization
        const isSenderWhitelisted =
          userWl.length > 0 &&
          userWl.some((uw) =>
            isSenderAuthorized(uw, rawRemoteJid, senderIdForApi) ||
            isSenderAuthorized(uw, targetJid, participantPn)
          );

        if (!isSenderWhitelisted) {
          return {
            allowed: false,
            reason: `Sender ${senderIdForApi} (${rawRemoteJid}) is NOT in WHITELIST.`,
          };
        }
      }
    }
  }

  let promptMessageText = textContent;

  if (isGroup) {
    let effectivePrefix: string | undefined = undefined;
    if (currentChannelConfig && currentChannelConfig.commandPrefix !== undefined) {
      effectivePrefix = currentChannelConfig.commandPrefix;
    } else if (store.commandPrefix !== undefined && store.commandPrefix !== null) {
      effectivePrefix = store.commandPrefix;
    } else {
      const cfgFile = getConfigFile(store.sessionId);
      if (fs.existsSync(cfgFile)) {
        try {
          const diskCfg = JSON.parse(fs.readFileSync(cfgFile, "utf-8"));
          if (diskCfg.commandPrefix !== undefined) {
            effectivePrefix = diskCfg.commandPrefix;
          }
        } catch {}
      }
    }

    const prefixResult = validateCommandPrefix(textContent, effectivePrefix);
    if (!prefixResult.allowed) {
      return {
        allowed: false,
        reason: prefixResult.reason,
      };
    }

    promptMessageText = prefixResult.cleanedMessage;
  }

  return { allowed: true, promptMessageText };
}

