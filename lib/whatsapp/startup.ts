import { loadPersistedChannels } from "../channelPersistence";
import type { ChannelItem } from "../channelTypes";
import { hasExistingSession } from "./store";
import { initWhatsAppSocket } from "./connection";
import type { WhatsAppStatus } from "./types";

export interface WhatsAppStartupSummary {
  readonly totalDiscovered: number;
  readonly waChannelsCount: number;
  readonly startedCount: number;
  readonly skippedCount: number;
  readonly failedCount: number;
}

export interface WhatsAppStartupOptions {
  readonly loadChannels?: () => ChannelItem[];
  readonly hasSession?: (channelId: string) => boolean;
  readonly initSocket?: (channelId: string) => Promise<WhatsAppStatus>;
}

export async function initWhatsAppOnStartup(
  options: WhatsAppStartupOptions = {}
): Promise<WhatsAppStartupSummary> {
  const loadChannels = options.loadChannels ?? loadPersistedChannels;
  const hasSession = options.hasSession ?? hasExistingSession;
  const initSocket = options.initSocket ?? initWhatsAppSocket;

  console.log("[WhatsApp Startup] Discovering persisted WhatsApp channels...");

  let channels: ChannelItem[] = [];
  try {
    channels = loadChannels();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[WhatsApp Startup] Failed to load persisted channels:", message);
    return {
      totalDiscovered: 0,
      waChannelsCount: 0,
      startedCount: 0,
      skippedCount: 0,
      failedCount: 0,
    };
  }

  const waChannels = channels.filter(
    (c) => c.type && c.type.toUpperCase() === "WHATSAPP"
  );

  console.log(
    `[WhatsApp Startup] Discovered ${channels.length} persisted channel(s), ${waChannels.length} WhatsApp channel(s).`
  );

  if (waChannels.length === 0) {
    console.log("[WhatsApp Startup] No WhatsApp channels configured. Startup initialization complete.");
    return {
      totalDiscovered: channels.length,
      waChannelsCount: 0,
      startedCount: 0,
      skippedCount: 0,
      failedCount: 0,
    };
  }

  let startedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (const channel of waChannels) {
    const channelId = channel.id;
    const channelName = channel.name || channelId;

    try {
      const hasCreds = hasSession(channelId);
      if (!hasCreds) {
        skippedCount++;
        console.log(
          `[WhatsApp Startup] Skipping WhatsApp channel "${channelId}" (${channelName}): No saved credentials found.`
        );
        continue;
      }

      console.log(
        `[WhatsApp Startup] Initializing saved WhatsApp session for channel "${channelId}" (${channelName})...`
      );

      const status = await initSocket(channelId);

      if (status.status === "DISCONNECTED" && status.lastError) {
        failedCount++;
        console.error(
          `[WhatsApp Startup] Channel "${channelId}" (${channelName}) initialization failed: ${status.lastError}`
        );
      } else {
        startedCount++;
        console.log(
          `[WhatsApp Startup] Successfully triggered initialization for channel "${channelId}" (${channelName}). Initial status: ${status.status}`
        );
      }
    } catch (err: unknown) {
      failedCount++;
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        `[WhatsApp Startup] Error initializing channel "${channelId}" (${channelName}):`,
        message
      );
    }
  }

  console.log(
    `[WhatsApp Startup] Completed automatic initialization: ${startedCount} started, ${skippedCount} skipped, ${failedCount} failed.`
  );

  return {
    totalDiscovered: channels.length,
    waChannelsCount: waChannels.length,
    startedCount,
    skippedCount,
    failedCount,
  };
}
