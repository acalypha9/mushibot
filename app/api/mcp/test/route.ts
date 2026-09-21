import { NextRequest, NextResponse } from "next/server";
import dns from "node:dns/promises";
import net from "node:net";
import { authFailure, requireAdminRequest } from "@/lib/serverAuth";

interface ToolDetail {
  name: string;
  description?: string;
}

function isPrivateOrLocalIp(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (lower === "localhost" || lower === "127.0.0.1" || lower === "::1" || lower === "0.0.0.0") return true;

  const match = lower.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (match) {
    const octets = match.slice(1).map(Number);
    if (octets.some((o) => o > 255)) return true;
    const [o1, o2] = octets;
    if (o1 === 10 || o1 === 127 || o1 === 0) return true;
    if (o1 === 172 && o2 >= 16 && o2 <= 31) return true;
    if (o1 === 192 && o2 === 168) return true;
    if (o1 === 169 && o2 === 254) return true;
  }
  return false;
}

async function hasPrivateResolution(hostname: string): Promise<boolean> {
  if (isPrivateOrLocalIp(hostname)) return true;
  if (net.isIP(hostname)) return false;
  try {
    const addresses = await dns.lookup(hostname, { all: true });
    return addresses.some(({ address }) => isPrivateOrLocalIp(address));
  } catch {
    return true;
  }
}

function parseResponseContent(text: string): { isMcp: boolean; tools: ToolDetail[] } {
  let foundMcp = false;
  const foundTools: ToolDetail[] = [];

  const addTool = (t: unknown) => {
    if (!t) return;
    if (typeof t === "string" && !foundTools.some((ft) => ft.name === t)) {
      foundTools.push({ name: t });
    } else if (typeof t === "object") {
      const toolObj = t as Record<string, unknown>;
      const name = typeof toolObj.name === "string" ? toolObj.name : typeof toolObj.id === "string" ? toolObj.id : undefined;
      const desc = typeof toolObj.description === "string" ? toolObj.description : undefined;
      if (name && !foundTools.some((ft) => ft.name === name)) {
        foundTools.push({ name, description: desc });
      }
    }
  };

  const processJsonData = (data: unknown) => {
    if (!data || typeof data !== "object") return;
    const obj = data as Record<string, unknown>;
    if (obj.jsonrpc === "2.0" || obj.result !== undefined || obj.tools !== undefined || obj.capabilities !== undefined) {
      foundMcp = true;
      const resultObj = obj.result && typeof obj.result === "object" ? (obj.result as Record<string, unknown>) : undefined;
      const rawTools = resultObj?.tools || obj.tools;
      if (Array.isArray(rawTools)) {
        for (const t of rawTools) addTool(t);
      }
    }
  };

  try {
    processJsonData(JSON.parse(text));
  } catch {}

  if (!foundMcp || foundTools.length === 0) {
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.startsWith("data:")) {
        try {
          processJsonData(JSON.parse(trimmed.slice(5).trim()));
        } catch {}
      }
    }
  }

  if (!foundMcp && (text.includes("jsonrpc") || text.includes("tools"))) foundMcp = true;
  return { isMcp: foundMcp, tools: foundTools };
}

export async function POST(req: NextRequest) {
  const failure = authFailure(requireAdminRequest(req));
  if (failure) return failure;
  try {
    const body = await req.json();
    const { config } = body;
    if (!config) return NextResponse.json({ success: false, error: "Configuration JSON is required" }, { status: 400 });

    let parsed: Record<string, unknown>;
    try {
      parsed = typeof config === "string" ? JSON.parse(config) : config;
      if (!parsed || typeof parsed !== "object") throw new Error("Invalid object");
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON syntax in configuration" }, { status: 400 });
    }

    if (parsed.url) {
      if (typeof parsed.url !== "string") {
        return NextResponse.json({ success: false, error: '"url" property must be a string' }, { status: 400 });
      }

      let targetUrl: URL;
      try {
        targetUrl = new URL(parsed.url);
        if (!["http:", "https:"].includes(targetUrl.protocol)) throw new Error("Protocol must be http: or https:");
      } catch {
        return NextResponse.json({ success: false, error: `"${parsed.url}" is not a valid URL.` }, { status: 400 });
      }

      if (await hasPrivateResolution(targetUrl.hostname)) {
        return NextResponse.json({
          success: false,
          error: "Connection to local, private, or metadata network addresses is prohibited for security."
        }, { status: 403 });
      }

      const rawCustomHeaders = parsed.headers && typeof parsed.headers === "object" ? (parsed.headers as Record<string, unknown>) : {};
      const customHeaders: Record<string, string> = {};
      const blockedHeaders = new Set(["host", "connection", "keep-alive", "proxy-authenticate", "proxy-authorization", "te", "trailers", "transfer-encoding", "upgrade"]);
      for (const [k, v] of Object.entries(rawCustomHeaders)) {
        if (typeof k === "string" && typeof v === "string" && !blockedHeaders.has(k.toLowerCase())) {
          customHeaders[k] = v;
        }
      }

      const baseHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
        ...customHeaders
      };

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);

        let discoveredTools: ToolDetail[] = [];
        let isMcp = false;
        let mcpSessionId: string | null = null;
        let lastStatus: number | null = null;
        let lastStatusText = "";

        // Step 1: Send initialize request to start session
        try {
          const initRes = await fetch(parsed.url, {
            method: "POST",
            headers: baseHeaders,
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: 1,
              method: "initialize",
              params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "chatbot-web", version: "1.0.0" } }
            }),
            signal: controller.signal
          });

          lastStatus = initRes.status;
          lastStatusText = initRes.statusText;
          const sid = initRes.headers.get("mcp-session-id");
          if (sid) mcpSessionId = sid;

          if (initRes.ok) {
            isMcp = true;
            const text = await initRes.text();
            const parsedRes = parseResponseContent(text);
            if (parsedRes.tools.length > 0) discoveredTools = parsedRes.tools;
          }
        } catch (err: unknown) {
          if (err instanceof Error && err.name === "AbortError") throw err;
        }

        // Step 2: Request tools/list with session ID or base headers
        try {
          const reqHeaders: Record<string, string> = { ...baseHeaders };
          if (mcpSessionId) reqHeaders["mcp-session-id"] = mcpSessionId;

          const toolsRes = await fetch(parsed.url, {
            method: "POST",
            headers: reqHeaders,
            body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }),
            signal: controller.signal
          });

          if (!lastStatus) {
            lastStatus = toolsRes.status;
            lastStatusText = toolsRes.statusText;
          }

          if (toolsRes.ok) {
            isMcp = true;
            const text = await toolsRes.text();
            const parsedRes = parseResponseContent(text);
            if (parsedRes.tools.length > 0) discoveredTools = parsedRes.tools;
          }
        } catch (err: unknown) {
          if (err instanceof Error && err.name === "AbortError") throw err;
        }

        // Step 3: Streamable HTTP GET request fallback
        if (!isMcp || discoveredTools.length === 0) {
          try {
            const getHeaders: Record<string, string> = { "Accept": "text/event-stream, application/json", ...customHeaders };
            if (mcpSessionId) getHeaders["mcp-session-id"] = mcpSessionId;

            const getRes = await fetch(parsed.url, { method: "GET", headers: getHeaders, signal: controller.signal });
            if (getRes.ok) {
              isMcp = true;
              const text = await getRes.text();
              const parsedRes = parseResponseContent(text);
              if (parsedRes.tools.length > 0) discoveredTools = parsedRes.tools;
            }
          } catch (err: unknown) {
            if (err instanceof Error && err.name === "AbortError") throw err;
          }
        }

        clearTimeout(timeoutId);

        if (isMcp) {
          const toolNames = discoveredTools.map((t) => t.name);
          const toolsText = toolNames.length > 0 ? ` (tools: ${toolNames.join(", ")})` : "";
          return NextResponse.json({ success: true, message: `MCP server is available!${toolsText}`, tools: discoveredTools });
        }

        const statusMsg = lastStatus ? ` HTTP ${lastStatus}${lastStatusText ? " " + lastStatusText : ""}` : "";
        return NextResponse.json({
          success: false,
          error: `Target URL (${targetUrl.hostname}) is not a valid MCP server.${statusMsg}`
        }, { status: 400 });

      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          return NextResponse.json({ success: false, error: `Connection timed out connecting to ${parsed.url}` }, { status: 408 });
        }
        const errorMsg = err instanceof Error ? err.message : "Network error";
        return NextResponse.json({
          success: false,
          error: `Unable to reach ${parsed.url}: ${errorMsg}`
        }, { status: 502 });
      }
    }

    if (parsed.command) {
      if (typeof parsed.command !== "string") {
        return NextResponse.json({ success: false, error: '"command" property must be a string' }, { status: 400 });
      }
      const args = Array.isArray(parsed.args) ? (parsed.args as unknown[]).map(String) : [];
      return NextResponse.json({
        success: true,
        message: `MCP server is available! (Stdio: "${parsed.command} ${args.join(" ")}")`,
        tools: []
      });
    }

    return NextResponse.json({ success: false, error: 'Configuration JSON must contain a valid "url" or "command".' }, { status: 400 });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Failed to test MCP connection";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
