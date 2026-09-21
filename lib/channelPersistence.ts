import fs from "fs";
import path from "path";
import type { ChannelItem } from "./channelTypes";
import { discoverSavedSessions } from "./channelDiscovery";
import { sanitizeSessionId } from "./telegram-store";

function getChannelsFilePath(): string {
  const authDir = path.join(process.cwd(), "auth");
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
  return path.join(authDir, "channels.json");
}

export function loadPersistedChannels(): ChannelItem[] {
  const filePath = getChannelsFilePath();
  let channels: ChannelItem[] = [];

  if (fs.existsSync(filePath)) {
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        channels = parsed;
      }
    } catch (e) {
      console.error("[Channels Persistence] Error reading channels.json:", e);
    }
  }

  // Perform auto-discovery for any saved WhatsApp or Telegram sessions on disk
  const discovered = discoverSavedSessions(channels);
  if (discovered.some((d) => !channels.some((c) => c.id === d.id))) {
    // Merge discovered sessions
    const mergedMap = new Map<string, ChannelItem>();
    for (const c of channels) {
      mergedMap.set(c.id, c);
    }
    for (const d of discovered) {
      if (!mergedMap.has(d.id)) {
        mergedMap.set(d.id, d);
      }
    }
    channels = Array.from(mergedMap.values());
    savePersistedChannels(channels);
  }

  return channels;
}

export function savePersistedChannels(channels: ChannelItem[]): void {
  try {
    const filePath = getChannelsFilePath();
    fs.writeFileSync(filePath, JSON.stringify(channels, null, 2), "utf-8");
  } catch (e) {
    console.error("[Channels Persistence] Error saving channels.json:", e);
  }
}

export function saveSingleChannelConfig(channel: ChannelItem): void {
  const safeId = sanitizeSessionId(channel.id);
  if (safeId !== channel.id) throw new Error("Invalid channel id");
  const channels = loadPersistedChannels();
  const index = channels.findIndex((c) => c.id === channel.id);
  const updatedItem: ChannelItem = {
    ...(index >= 0 ? channels[index] : {}),
    ...channel,
    whitelist: channel.whitelist !== undefined ? channel.whitelist : (index >= 0 ? channels[index].whitelist || "" : ""),
    blacklist: channel.blacklist !== undefined ? channel.blacklist : (index >= 0 ? channels[index].blacklist || "" : ""),
    replyMode: channel.replyMode || (index >= 0 ? channels[index].replyMode : "all") || "all",
    commandPrefix: channel.commandPrefix !== undefined ? channel.commandPrefix : (index >= 0 ? channels[index].commandPrefix : ".ai"),
    updatedAt: new Date().toISOString(),
  };
  if (index >= 0) {
    channels[index] = updatedItem;
  } else {
    channels.push({ ...updatedItem, createdAt: channel.createdAt || new Date().toISOString() });
  }
  savePersistedChannels(channels);

  // Sync to individual channel config files if needed
  if (channel.type === "WHATSAPP") {
    const waConfigPath = path.join(process.cwd(), "auth", "whatsapp", channel.id, "whatsapp_config.json");
    if (fs.existsSync(path.dirname(waConfigPath))) {
      try {
        let existingCfg: any = {};
        if (fs.existsSync(waConfigPath)) {
          existingCfg = JSON.parse(fs.readFileSync(waConfigPath, "utf-8"));
        }
        const updatedCfg = {
          ...existingCfg,
          name: channel.name,
          autoReplyEnabled: channel.autoReplyEnabled,
          systemPrompt: channel.systemPrompt,
          model: channel.model,
          responseTimeout: channel.timeoutSeconds || 120,
          sessionTimeout: channel.sessionTimeoutSeconds || 300,
          commandPrefix: channel.commandPrefix,
          whitelist: channel.whitelist,
          blacklist: channel.blacklist,
          replyMode: channel.replyMode || "all",
          createdAt: channel.createdAt,
        };
        fs.writeFileSync(waConfigPath, JSON.stringify(updatedCfg, null, 2), "utf-8");
      } catch (e) {}
    }
  } else if (channel.type === "TELEGRAM") {
    const tgConfigPath = path.join(process.cwd(), "auth", "telegram", channel.id, "telegram_config.json");
    if (fs.existsSync(path.dirname(tgConfigPath))) {
      try {
        let existingCfg = {};
        if (fs.existsSync(tgConfigPath)) {
          existingCfg = JSON.parse(fs.readFileSync(tgConfigPath, "utf-8"));
        }
        const updatedCfg = {
          ...existingCfg,
          name: channel.name,
          autoReplyEnabled: channel.autoReplyEnabled,
          systemPrompt: channel.systemPrompt,
          model: channel.model,
          responseTimeout: channel.timeoutSeconds || 120,
          sessionTimeout: channel.sessionTimeoutSeconds || 300,
          createdAt: channel.createdAt,
        };
        fs.writeFileSync(tgConfigPath, JSON.stringify(updatedCfg, null, 2), "utf-8");
      } catch (e) {}
    }
  }
}

export function deleteSingleChannel(channelId: string): void {
  const safeId = sanitizeSessionId(channelId);
  if (safeId !== channelId) throw new Error("Invalid channel id");
  const channels = loadPersistedChannels();
  const filtered = channels.filter((c) => c.id !== channelId);
  savePersistedChannels(filtered);

  // Remove disk directories for channelId
  try {
    const waDir = path.join(process.cwd(), "auth", "whatsapp", safeId);
    if (fs.existsSync(waDir)) {
      fs.rmSync(waDir, { recursive: true, force: true });
    }
    const tgDir = path.join(process.cwd(), "auth", "telegram", safeId);
    if (fs.existsSync(tgDir)) {
      fs.rmSync(tgDir, { recursive: true, force: true });
    }
  } catch (e) {
    console.error(`[Channels Persistence] Error removing auth dirs for ${channelId}:`, e);
  }
}
