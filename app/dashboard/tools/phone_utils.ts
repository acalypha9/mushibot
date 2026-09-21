import {
  splitPhoneNumber,
  extractCountryCodeFromInput,
  combinePhoneNumber,
} from "@/lib/phoneNormalization";

export { splitPhoneNumber, extractCountryCodeFromInput, combinePhoneNumber };

export function cleanPhoneNumber(raw: string): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (trimmed.endsWith("@g.us") || trimmed.includes("@")) return trimmed;
  return trimmed.replace(/[^\d+]/g, "");
}

export function isGroupJid(recipient: string): boolean {
  if (!recipient) return false;
  const val = recipient.trim().toLowerCase();
  return val.endsWith("@g.us") || val.startsWith("@");
}

export function isValidPhoneNumber(raw: string): boolean {
  if (!raw) return false;
  const clean = cleanPhoneNumber(raw);
  if (isGroupJid(clean)) return true;
  const digits = clean.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

export function formatRecipientDisplay(recipient: string): string {
  if (!recipient) return "";
  const trimmed = recipient.trim();
  if (isGroupJid(trimmed)) return trimmed;
  const { countryCode, localNumber } = splitPhoneNumber(trimmed);
  if (countryCode && localNumber) {
    return `${countryCode} ${localNumber}`;
  }
  return trimmed;
}

export function normalizeToolRecipient(raw: string, defaultCountryCode = "+62"): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (isGroupJid(trimmed)) return trimmed;
  return combinePhoneNumber(trimmed, defaultCountryCode);
}
