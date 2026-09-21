export const RATE_LIMIT_BOUNDS = {
  rateLimit: { min: 1, max: 100, default: 5 },
  maxTokens: { min: 50, max: 16384, default: 500 },
  timeout: { min: 5, max: 300, default: 30 },
  sessionTimeout: { min: 30, max: 86400, default: 300 },
  typingDelay: { min: 0, max: 5000, step: 100, default: 1000 },
} as const;

export function clampNumericBound(
  value: number,
  field: keyof typeof RATE_LIMIT_BOUNDS
): number {
  const bounds = RATE_LIMIT_BOUNDS[field];
  if (Number.isNaN(value) || value === null || value === undefined) {
    return bounds.default;
  }
  if (value < bounds.min) return bounds.min;
  if (value > bounds.max) return bounds.max;
  return value;
}

export function togglePrivateGroupAccess(
  modeToToggle: "private" | "group",
  current: { allowPrivate: boolean; allowGroup: boolean }
): { allowPrivate: boolean; allowGroup: boolean } {
  const { allowPrivate, allowGroup } = current;

  if (modeToToggle === "private") {
    // Keep at least one enabled
    if (allowPrivate && !allowGroup) {
      return { allowPrivate, allowGroup };
    }
    return { allowPrivate: !allowPrivate, allowGroup };
  }

  // modeToToggle === "group"
  if (allowGroup && !allowPrivate) {
    return { allowPrivate, allowGroup };
  }
  return { allowPrivate, allowGroup: !allowGroup };
}

export function normalizeRecipientEntry(
  raw: string,
  countryCode: string,
  combineFn: (local: string, code: string) => string
): string {
  const formatted = combineFn(raw, countryCode);
  return formatted.trim();
}

export function isGroupRecipient(recipient: string, channelType?: "WHATSAPP" | "TELEGRAM"): boolean {
  const item = recipient.trim();
  if (!item) return false;
  if (item.includes("@g.us")) return true;
  if (channelType === "TELEGRAM" && item.startsWith("-")) return true;
  if (item.startsWith("120363") || /^\d{15,25}$/.test(item.replace(/[^\d]/g, ""))) return true;
  return false;
}

export function computeHasGroupsSelected(params: {
  allowGroup: boolean;
  replyMode: "all" | "specific";
  whitelistList: string[];
  channelType?: "WHATSAPP" | "TELEGRAM";
}): boolean {
  const { allowGroup, replyMode, whitelistList, channelType } = params;
  if (!allowGroup) return false;
  if (replyMode === "all") return true;
  return whitelistList.some((item) => isGroupRecipient(item, channelType));
}

export function resolveCommandPrefixDefault(
  currentPrefix: string,
  newRecipient: string
): string {
  if (!currentPrefix.trim() && (newRecipient.includes("@g.us") || newRecipient.startsWith("-"))) {
    return ".ai";
  }
  return currentPrefix;
}
