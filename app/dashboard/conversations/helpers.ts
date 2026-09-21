import type { Conversation, SortColumn, SortDirection } from "./types";

export function isUUID(str: string): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
}

export function isWhatsAppGroup(str: string): boolean {
  if (!str) return false;
  const s = str.trim();
  if (isUUID(s)) return false;
  if (s.includes("@g.us")) return true;
  if (s.startsWith("120363")) return true;
  return /^\d{15,25}$/.test(s.replace(/^\+/, ""));
}

export function isValidPhoneNumber(str: string): boolean {
  if (!str) return false;
  const s = str.trim();
  if (isUUID(s) || isWhatsAppGroup(s)) return false;
  const digits = s.replace(/[^\d]/g, "");
  return digits.length >= 8 && digits.length <= 14;
}

export function resolveWhatsAppGroupName(rawId: string, dynamicMap?: Record<string, string>): string {
  if (!rawId) return "WhatsApp Group";
  const cleanId = rawId.replace(/@g\.us$/, "").replace(/^\+/, "").trim();
  if (dynamicMap && (dynamicMap[cleanId] || dynamicMap[rawId])) {
    return dynamicMap[cleanId] || dynamicMap[rawId];
  }
  return "WhatsApp Group";
}

export function getConversationTitleDisplay(c: Conversation, dynamicMap?: Record<string, string>): string {
  const rawTitle = (c.title || "Untitled Conversation").replace(/\s*\(\+?\d+\)/g, "").trim();
  const rawPhone = (c.customer_phone || "").trim();
  const isGroup = isWhatsAppGroup(rawPhone) || rawTitle.toLowerCase().includes("group") || ((c.channel || "").toUpperCase() === "WHATSAPP" && isWhatsAppGroup(rawPhone));

  if (isGroup) {
    const knownName = resolveWhatsAppGroupName(rawPhone, dynamicMap);
    let resolvedGroup = "";

    // 1. If title starts with "Whatsapp Group - ", extract explicit group name
    if (/^whatsapp\s*group\s*-\s*/i.test(rawTitle)) {
      resolvedGroup = rawTitle.replace(/^whatsapp\s*group\s*-\s*/i, "").trim();
    }
    // 2. If title starts with generic "[Channel] Group - "
    else if (/^[a-z0-9_-]+\s*group\s*-\s*/i.test(rawTitle)) {
      resolvedGroup = rawTitle.replace(/^[a-z0-9_-]+\s*group\s*-\s*/i, "").trim();
    }
    // 3. If title is formatted like "Test Group - Test Group" or "Test Group - Fahroldhi Sukirno"
    else if (rawTitle.includes(" - ")) {
      const firstPart = rawTitle.split(" - ")[0].trim();
      if (firstPart && !firstPart.toLowerCase().startsWith("whatsapp")) {
        resolvedGroup = firstPart;
      }
    }

    // 4. Fallback if empty, "Group", or generic "WhatsApp Group"
    if (!resolvedGroup || resolvedGroup.toLowerCase() === "group" || resolvedGroup.toLowerCase() === "whatsapp group") {
      if (knownName && knownName !== "WhatsApp Group") {
        resolvedGroup = knownName;
      } else if (rawTitle && !rawTitle.toLowerCase().startsWith("untitled") && !rawTitle.toLowerCase().includes("group")) {
        resolvedGroup = rawTitle;
      } else {
        resolvedGroup = "Group";
      }
    }

    // Deduplicate repeated group names
    if (resolvedGroup.includes(" - ")) {
      const parts = resolvedGroup.split(" - ").map((p) => p.trim());
      if (parts[0] && parts[0].toLowerCase() === parts[1]?.toLowerCase()) {
        resolvedGroup = parts[0];
      }
    }

    return `Whatsapp Group - ${resolvedGroup}`;
  }

  return rawTitle;
}

export interface UserDisplayInfo {
  label: string;
  primary: string;
  secondary?: string;
  type: "phone" | "name";
}

export function getUserDisplay(c: Conversation, dynamicMap?: Record<string, string>): UserDisplayInfo {
  const channel = (c.channel || "").toLowerCase();
  const isWebChat = channel === "web" || channel === "webchat";
  const rawPhone = (c.customer_phone || "").trim();
  const isGroup = isWhatsAppGroup(rawPhone) || (c.title || "").toLowerCase().includes("group");

  // 1. Webchat: Full Name with small email underneath
  if (isWebChat) {
    const fullName = (c.customer_name && c.customer_name.trim() && !isUUID(c.customer_name))
      ? c.customer_name.trim()
      : (c.title && !c.title.startsWith("Session #") && !isUUID(c.title))
        ? c.title
        : "Web User";

    const email = (c.customer_email && c.customer_email.trim() && !isUUID(c.customer_email))
      ? c.customer_email.trim()
      : undefined;

    return {
      label: fullName,
      primary: fullName,
      secondary: email,
      type: "name"
    };
  }

  // 2. WhatsApp Group: Full name with Phone number underneath (Same as WhatsApp private chat)
  if (isGroup) {
    const knownGroupName = resolveWhatsAppGroupName(rawPhone, dynamicMap);
    let groupMemberName = "";

    // Check if customer_name has a valid member name (not UUID, not generic, not the group name itself)
    if (c.customer_name && c.customer_name.trim() && !isUUID(c.customer_name)) {
      const trimmed = c.customer_name.trim();
      const isGeneric = ["member", "group", "whatsapp group member", "user", "guest"].includes(trimmed.toLowerCase());
      const isSameAsGroup = (knownGroupName && trimmed.toLowerCase() === knownGroupName.toLowerCase()) || trimmed.toLowerCase().includes("group");
      if (!isGeneric && !isSameAsGroup) {
        groupMemberName = trimmed;
      }
    }

    // Fallback: If title had format "[GroupName] - [MemberName]"
    if (!groupMemberName && c.title && c.title.includes(" - ")) {
      const parts = c.title.split(" - ");
      const secondPart = parts.slice(1).join(" - ").trim();
      if (
        secondPart &&
        !isUUID(secondPart) &&
        !secondPart.toLowerCase().startsWith("whatsapp") &&
        secondPart.toLowerCase() !== "group" &&
        secondPart.toLowerCase() !== "whatsapp group member" &&
        secondPart.toLowerCase() !== knownGroupName.toLowerCase() &&
        !secondPart.toLowerCase().includes("group")
      ) {
        groupMemberName = secondPart;
      }
    }

    // Phone number from participant_phone
    let memberPhone = "";
    if (c.participant_phone && !isUUID(c.participant_phone)) {
      const cleanDigits = c.participant_phone.replace(/[^\d]/g, "").trim();
      if (cleanDigits.length >= 8) {
        memberPhone = `+${cleanDigits}`;
      }
    }

    const primaryName = groupMemberName || (memberPhone ? memberPhone : "Member");
    const secondaryPhone = (groupMemberName && memberPhone && groupMemberName !== memberPhone) ? memberPhone : undefined;

    return {
      label: primaryName,
      primary: primaryName,
      secondary: secondaryPhone,
      type: groupMemberName ? "name" : "phone"
    };
  }

  // 3. WhatsApp 1-on-1 Chat: Name with Phone number underneath
  let senderName = "";
  if (c.title && c.title.includes(" - ")) {
    const parts = c.title.split(" - ");
    const extracted = parts.slice(1).join(" - ").trim();
    if (extracted && !isUUID(extracted)) {
      senderName = extracted;
    }
  }
  if (!senderName && c.customer_name && c.customer_name.trim() && !isUUID(c.customer_name)) {
    senderName = c.customer_name.trim();
  }

  let formattedPhone = "";
  if (rawPhone && !isUUID(rawPhone)) {
    const p = rawPhone.replace(/@s\.whatsapp\.net|@lid/g, "").replace(/[^\d+]/g, "").trim();
    if (isValidPhoneNumber(p)) {
      formattedPhone = p.startsWith("+") ? p : `+${p}`;
    } else {
      formattedPhone = rawPhone.replace(/^\+/, "");
    }
  }

  const primaryName = senderName || formattedPhone || c.title || "User";
  const secondaryDetail = (senderName && formattedPhone && senderName !== formattedPhone) ? formattedPhone : (c.customer_email || undefined);

  return {
    label: primaryName,
    primary: primaryName,
    secondary: secondaryDetail,
    type: formattedPhone && !senderName ? "phone" : "name"
  };
}

export function filterAndSortConversations(
  conversations: Conversation[],
  searchTerm: string,
  platformFilter: string,
  typeFilter: string,
  sortColumn: SortColumn,
  sortDirection: SortDirection
): Conversation[] {
  const term = searchTerm.trim().toLowerCase();
  const platform = platformFilter.toLowerCase();
  const statusType = typeFilter.toLowerCase();

  return conversations
    .filter((c) => {
      const groupName = isWhatsAppGroup(c.customer_phone || "") ? resolveWhatsAppGroupName(c.customer_phone || "") : null;
      const userDisplay = getUserDisplay(c);
      const matchesSearch =
        !term ||
        (c.title && c.title.toLowerCase().includes(term)) ||
        (groupName && groupName.toLowerCase().includes(term)) ||
        (c.customer_name && c.customer_name.toLowerCase().includes(term)) ||
        (c.customer_email && c.customer_email.toLowerCase().includes(term)) ||
        (c.customer_phone && c.customer_phone.toLowerCase().includes(term)) ||
        (c.participant_phone && c.participant_phone.toLowerCase().includes(term)) ||
        (userDisplay.primary && userDisplay.primary.toLowerCase().includes(term)) ||
        (userDisplay.secondary && userDisplay.secondary.toLowerCase().includes(term)) ||
        c.id.toLowerCase().includes(term) ||
        c.channel.toLowerCase().includes(term);

      const matchesPlatform = platform === "all" || c.channel.toLowerCase() === platform;
      const matchesType = statusType === "all" || c.status.toLowerCase() === statusType;

      return matchesSearch && matchesPlatform && matchesType;
    })
    .sort((a, b) => {
      let valA: string | number = "";
      let valB: string | number = "";

      if (sortColumn === "title") {
        valA = getConversationTitleDisplay(a).toLowerCase();
        valB = getConversationTitleDisplay(b).toLowerCase();
      } else if (sortColumn === "created_at") {
        valA = new Date(a.created_at).getTime();
        valB = new Date(b.created_at).getTime();
      } else if (sortColumn === "updated_at") {
        valA = new Date(a.updated_at || a.created_at).getTime();
        valB = new Date(b.updated_at || b.created_at).getTime();
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
}

export function paginateConversations(
  items: Conversation[],
  currentPage: number,
  itemsPerPage: number
): {
  paginated: Conversation[];
  totalItems: number;
  totalPages: number;
  startIndex: number;
} {
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = items.slice(startIndex, startIndex + itemsPerPage);

  return {
    paginated,
    totalItems,
    totalPages,
    startIndex
  };
}
