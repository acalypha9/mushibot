import { NextRequest, NextResponse } from "next/server";
import { authFailure, requireAdminRequest } from "@/lib/serverAuth";
import {
  getWhatsAppStatus,
  initWhatsAppSocket,
  disconnectWhatsApp,
  setAutoReply,
  sendWhatsAppBroadcast,
  sendDirectMessage,
  getWhatsAppGroups,
} from "@/lib/whatsapp";

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
    const action = req.nextUrl.searchParams.get("action");

    if (action === "groups") {
      const forceRefresh =
        req.nextUrl.searchParams.get("force") === "true" ||
        req.nextUrl.searchParams.get("refresh") === "true";
      const groups = await getWhatsAppGroups(channelId, forceRefresh);
      return NextResponse.json({ groups });
    }

    const status = getWhatsAppStatus(channelId);
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch WhatsApp status" },
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
    const { action, autoReply, systemPrompt, model, responseTimeout, timeoutSeconds, sessionTimeout, sessionTimeoutSeconds, recipients, message, retrievalK, jid, text } = body;

    const respTimeout = typeof responseTimeout === "number" ? responseTimeout : typeof timeoutSeconds === "number" ? timeoutSeconds : undefined;
    const sessTimeout = typeof sessionTimeout === "number" ? sessionTimeout : typeof sessionTimeoutSeconds === "number" ? sessionTimeoutSeconds : undefined;

    if (typeof retrievalK === "number" && retrievalK > 0) {
      try {
        await fetch(`${process.env.API_INTERNAL_URL ?? "http://127.0.0.1:8080"}/api/knowledge/settings/public-update-k`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ retrieval_k: retrievalK }),
        });
      } catch (err) {
        console.error("Failed to sync retrievalK to FastAPI backend:", err);
      }
    }

    if (action === "send_direct") {
      if (!jid || !text) {
        return NextResponse.json({ error: "jid and text string required" }, { status: 400 });
      }
      const success = await sendDirectMessage(channelId, jid, text);
      return NextResponse.json({ success });
    }

    if (action === "connect") {
      const status = await initWhatsAppSocket(channelId, true);
      return NextResponse.json(status);
    }

    if (action === "disconnect" || action === "reset") {
      const status = await disconnectWhatsApp(channelId, true);
      return NextResponse.json(status);
    }

    if (action === "toggle_autoreply") {
      const status = setAutoReply(channelId, typeof autoReply === "boolean" ? autoReply : true, systemPrompt, model, respTimeout, sessTimeout);
      return NextResponse.json(status);
    }

    if (action === "broadcast") {
      if (!Array.isArray(recipients) || !message) {
        return NextResponse.json({ error: "recipients array and message string required" }, { status: 400 });
      }
      const result = await sendWhatsAppBroadcast(channelId, recipients, message, {
        blacklist: body.blacklist,
        allowPrivate: body.allowPrivate,
        allowGroup: body.allowGroup,
      });
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
