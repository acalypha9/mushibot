import type { ChannelOption } from "./types";

export function getMcpServersEndpoint() {
  return {
    url: "/api/mcp/servers",
    method: "GET" as const,
  };
}

export function getMcpServerToggleEndpoint(serverId: string) {
  return {
    url: `/api/mcp/servers/${serverId}/toggle`,
    method: "PATCH" as const,
  };
}

export function getMcpServerDeleteEndpoint(serverId: string) {
  return {
    url: `/api/mcp/servers/${serverId}`,
    method: "DELETE" as const,
  };
}

export function getRemindersChannelsEndpoint() {
  return {
    url: "/api/reminders/channels",
    method: "GET" as const,
  };
}

export function getReminderToggleEndpoint(reminderId: string) {
  return {
    url: `/api/reminders/${reminderId}/toggle`,
    method: "PATCH" as const,
  };
}

export function getReminderDeleteEndpoint(reminderId: string) {
  return {
    url: `/api/reminders/${reminderId}`,
    method: "DELETE" as const,
  };
}

export function unpackChannelsResponse(data: unknown): ChannelOption[] {
  if (!data) return [];
  const list = Array.isArray(data)
    ? data
    : typeof data === "object" && data !== null && Array.isArray((data as Record<string, unknown>).channels)
    ? ((data as Record<string, unknown>).channels as unknown[])
    : [];

  return list.map((item) => {
    const obj = (item || {}) as Record<string, unknown>;
    const rawType = String(obj.type || obj.channel_type || obj.platform || "WHATSAPP").toUpperCase();
    const typeVal: "WHATSAPP" | "TELEGRAM" = rawType === "TELEGRAM" ? "TELEGRAM" : "WHATSAPP";
    return {
      id: String(obj.id || "default"),
      name: String(obj.name || obj.channel_name || obj.id || "Channel"),
      type: typeVal,
      platform: String(obj.platform || typeVal),
      status: typeof obj.status === "string" ? obj.status : undefined,
    };
  });
}

export function isSafeReminderUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim().toLowerCase();
  return trimmed.startsWith("http://") || trimmed.startsWith("https://");
}
