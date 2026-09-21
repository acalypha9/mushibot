import { NextRequest, NextResponse } from "next/server";
import { authFailure, requireAdminRequest } from "@/lib/serverAuth";
import {
  getTelegramStatus,
  initTelegramBot,
  disconnectTelegram,
  setTelegramConfig,
  sendTelegramBroadcast,
} from "@/lib/telegram";

function sanitizeChannelId(val: string | null | undefined): string {
  if (!val || typeof val !== "string") return "default";
  const cleaned = val.replace(/[^a-zA-Z0-9_\-]/g, "");
  return cleaned || "default";
}

export async function GET(req: NextRequest) {
  const failure = authFailure(requireAdminRequest(req));
  if (failure) return failure;
  try {
    const rawId = req.nextUrl.searchParams.get("channel_id") || req.nextUrl.searchParams.get("channelId") || req.nextUrl.searchParams.get("session_id");
    const channelId = sanitizeChannelId(rawId);
    const status = getTelegramStatus(channelId);
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch Telegram status" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const failure = authFailure(requireAdminRequest(req));
  if (failure) return failure;
  try {
    const body = await req.json();
    const rawId = body.channel_id || body.channelId || body.session_id || body.channelName;
    const channelId = sanitizeChannelId(rawId);
    const { action, token, botToken, autoReply, systemPrompt, model, responseTimeout, timeoutSeconds, sessionTimeout, sessionTimeoutSeconds, recipients, message } = body;

    const targetToken = token || botToken;
    const respTimeout = typeof responseTimeout === "number" ? responseTimeout : typeof timeoutSeconds === "number" ? timeoutSeconds : undefined;
    const sessTimeout = typeof sessionTimeout === "number" ? sessionTimeout : typeof sessionTimeoutSeconds === "number" ? sessionTimeoutSeconds : undefined;

    if (action === "connect") {
      if (!targetToken) {
        return NextResponse.json({ error: "Telegram Bot Token is required." }, { status: 400 });
      }
      const status = await initTelegramBot(channelId, targetToken);
      return NextResponse.json(status);
    }

    if (action === "disconnect") {
      const status = await disconnectTelegram(channelId);
      return NextResponse.json(status);
    }

    if (action === "toggle_autoreply") {
      const status = setTelegramConfig(channelId, typeof autoReply === "boolean" ? autoReply : true, systemPrompt, model, respTimeout, sessTimeout);
      return NextResponse.json(status);
    }

    if (action === "broadcast") {
      if (!Array.isArray(recipients) || !message) {
        return NextResponse.json({ error: "recipients array and message string required" }, { status: 400 });
      }
      const result = await sendTelegramBroadcast(channelId, recipients, message);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
