import type { McpTemplateType, McpServerPayload, McpToolItem } from "./types";

export * from "./cron_utils";
export * from "./phone_utils";

export const DATE_FORMAT_OPTIONS = [
  "DD/MM/YYYY", "DD:MM:YYYY", "DD-MM-YYYY", "YYYY-MM-DD",
  "DD MMMM YYYY", "dddd, DD MMMM YYYY", "DD MMM YYYY"
].map((v) => ({ value: v, label: v }));

export const TIME_FORMAT_OPTIONS = ["HH:mm", "HH:mm:ss", "hh:mm A"].map((v) => ({ value: v, label: v }));

export const DATETIME_FORMAT_OPTIONS = [
  "DD/MM/YYYY HH:mm", "DD:MM:YYYY HH:mm", "DD-MM-YYYY HH:mm",
  "YYYY-MM-DD HH:mm", "DD MMMM YYYY, HH:mm", "dddd, DD MMMM YYYY HH:mm"
].map((v) => ({ value: v, label: v }));

export function getTimezoneGmtLabel(tz: string): string {
  try {
    const tzPart = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" }).formatToParts(new Date()).find((p) => p.type === "timeZoneName");
    return `${tzPart ? tzPart.value : "GMT"} - ${tz}`;
  } catch {
    return tz;
  }
}

export function getDynamicTimezones(): Array<{ value: string; label: string; offsetMins: number }> {
  try {
    const intlObj = Intl as unknown as { supportedValuesOf?: (key: string) => string[] };
    let zones: string[] = typeof intlObj.supportedValuesOf === "function" ? intlObj.supportedValuesOf("timeZone") : [];
    if (!zones.includes("UTC")) zones = ["UTC", ...zones];
    const now = new Date(), utcDate = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }));
    return Array.from(new Set(zones)).map((tz: string) => {
      try {
        const targetDate = new Date(now.toLocaleString("en-US", { timeZone: tz }));
        return { value: tz, label: getTimezoneGmtLabel(tz), offsetMins: (targetDate.getTime() - utcDate.getTime()) / 60000 };
      } catch {
        return { value: tz, label: tz, offsetMins: 0 };
      }
    }).sort((a, b) => a.offsetMins !== b.offsetMins ? a.offsetMins - b.offsetMins : a.value.localeCompare(b.value));
  } catch {
    return [{ value: "UTC", label: "GMT+0 - UTC", offsetMins: 0 }, { value: "Asia/Jakarta", label: "GMT+7 - Asia/Jakarta", offsetMins: 420 }];
  }
}

export const DYNAMIC_TIMEZONE_OPTIONS = getDynamicTimezones();

export function formatSchemaJson(jsonStr: string | null): string {
  if (!jsonStr) return "{}";
  try { return JSON.stringify(JSON.parse(jsonStr), null, 2); } catch { return jsonStr; }
}

export const MCP_TEMPLATES = {
  stdio: '{\n  "command": "npx",\n  "args": ["-y", "@modelcontextprotocol/server-memory"],\n  "env": {}\n}',
  streamable_http: '{\n  "url": "mcp_server_url",\n  "headers": {\n    "Authorization": "your_api_key"\n  }\n}',
} as const;

export function pushEditorHistory(history: string[], index: number, newVal: string): { history: string[]; index: number } {
  const current = history.slice(0, index + 1);
  return current[current.length - 1] !== newVal ? { history: [...current, newVal], index: index + 1 } : { history: current, index };
}

export function validateAndBuildMcpPayload(
  serverName: string,
  templateType: McpTemplateType | null,
  configJson: string,
  tools: (string | McpToolItem)[]
): { error: string } | { payload: McpServerPayload } {
  const name = serverName.trim();
  if (!name) return { error: "Error: Please enter a Server Name." };
  const raw = configJson.trim();
  if (!raw) return { error: "Error: Please enter Server Configuration JSON." };

  let parsed: Record<string, unknown> | null = null;
  try { parsed = JSON.parse(raw) as Record<string, unknown>; } catch { return { error: "Error: Invalid JSON syntax in Server Configuration." }; }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { error: "Error: Configuration must be a valid JSON object." };
  }

  let endpoint = "mcp_server_url";
  if (parsed.url) {
    const urlStr = String(parsed.url).trim();
    if (urlStr.toLowerCase() === "mcp_server_url" || (!urlStr.startsWith("http://") && !urlStr.startsWith("https://"))) {
      return { error: "Please provide a valid URL." };
    }
    endpoint = urlStr;
  } else if (parsed.command) {
    if (!String(parsed.command).trim()) return { error: "Error: 'command' cannot be empty." };
    const args = Array.isArray(parsed.args) ? parsed.args.join(" ") : "";
    endpoint = `${String(parsed.command)} ${args}`.trim();
  } else {
    return { error: "Error: Configuration JSON must contain a valid 'url' or 'command'." };
  }

  return {
    payload: {
      name,
      transport: templateType === "stdio" ? "STDIO" : "Streamable HTTP",
      endpoint_url: endpoint,
      env_json: configJson,
      tools,
    },
  };
}
