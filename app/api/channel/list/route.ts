import { NextRequest, NextResponse } from "next/server";
import { authFailure, requireAdminRequest } from "@/lib/serverAuth";
import {
  loadPersistedChannels,
  savePersistedChannels,
  saveSingleChannelConfig,
  deleteSingleChannel,
  ChannelItem,
} from "@/lib/channels";

export async function GET(req: NextRequest) {
  const failure = authFailure(requireAdminRequest(req));
  if (failure) return failure;
  try {
    const channels = loadPersistedChannels();
    return NextResponse.json({ channels });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load channels" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const failure = authFailure(requireAdminRequest(req));
  if (failure) return failure;
  try {
    const body = await req.json();
    const { action, channel, channels: clientChannels, channelId } = body;

    if (action === "sync") {
      const serverChannels = loadPersistedChannels();
      return NextResponse.json({ success: true, channels: serverChannels });
    }

    if (action === "save" || action === "add") {
      if (!channel || !channel.id || !/^[a-zA-Z0-9_-]{1,64}$/.test(channel.id)) {
        return NextResponse.json({ error: "Channel object with id is required" }, { status: 400 });
      }
      saveSingleChannelConfig(channel);
      const updatedList = loadPersistedChannels();
      return NextResponse.json({ success: true, channels: updatedList });
    }

    if (action === "delete") {
      if (!channelId || !/^[a-zA-Z0-9_-]{1,64}$/.test(channelId)) {
        return NextResponse.json({ error: "channelId is required" }, { status: 400 });
      }
      deleteSingleChannel(channelId);
      const updatedList = loadPersistedChannels();
      return NextResponse.json({ success: true, channels: updatedList });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
