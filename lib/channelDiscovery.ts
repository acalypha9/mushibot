import fs from "fs";
import path from "path";
import type { ChannelItem } from "./channelTypes";

export function discoverSavedSessions(existing: ChannelItem[]): ChannelItem[] {
  const discovered: ChannelItem[] = [];

  // 1. Scan WhatsApp sessions
  try {
    const waAuthBase = path.join(process.cwd(), "auth", "whatsapp");
    if (fs.existsSync(waAuthBase)) {
      const dirs = fs.readdirSync(waAuthBase);
      for (const chanId of dirs) {
        if (chanId === "default" && dirs.length > 1) continue; // Skip default if specific channel exists
        const dirPath = path.join(waAuthBase, chanId);
        const credsFile = path.join(dirPath, "creds.json");
        const configFile = path.join(dirPath, "whatsapp_config.json");

        const hasCreds = fs.existsSync(credsFile) && fs.statSync(credsFile).size > 10;
        const hasConfig = fs.existsSync(configFile);

        if (hasCreds || hasConfig) {
          let name = `WhatsApp Channel`;
          let autoReply = true;
          let systemPrompt: string | undefined = undefined;
          let model: string | undefined = undefined;
          let timeoutSeconds = 30;
          let sessionTimeoutSeconds = 300;
          let boundPhone: string | undefined = undefined;
          let createdAt = new Date().toISOString();

          let replyMode: "all" | "specific" = "all";
          let whitelist = "";
          let blacklist = "";
          let commandPrefix = "";
          let allowPrivate = true;
          let allowGroup = true;

          if (hasConfig) {
            try {
              const cfg = JSON.parse(fs.readFileSync(configFile, "utf-8"));
              if (cfg.name) name = cfg.name;
              if (typeof cfg.autoReplyEnabled === "boolean") autoReply = cfg.autoReplyEnabled;
              if (cfg.systemPrompt) systemPrompt = cfg.systemPrompt;
              if (cfg.model) model = cfg.model;
              if (typeof cfg.responseTimeout === "number") timeoutSeconds = cfg.responseTimeout;
              if (typeof cfg.sessionTimeout === "number") sessionTimeoutSeconds = cfg.sessionTimeout;
              if (cfg.createdAt) createdAt = cfg.createdAt;
              if (cfg.replyMode) replyMode = cfg.replyMode;
              if (cfg.whitelist !== undefined) whitelist = cfg.whitelist;
              if (cfg.blacklist !== undefined) blacklist = cfg.blacklist;
              if (cfg.commandPrefix !== undefined) commandPrefix = cfg.commandPrefix;
              if (typeof cfg.allowPrivate === "boolean") allowPrivate = cfg.allowPrivate;
              if (typeof cfg.allowGroup === "boolean") allowGroup = cfg.allowGroup;
            } catch (e) {}
          }

          if (hasCreds) {
            try {
              const creds = JSON.parse(fs.readFileSync(credsFile, "utf-8"));
              const jid = creds.me?.id || "";
              const rawPhone = jid.split(":")[0] || jid.split("@")[0] || "";
              if (rawPhone && /^\d+$/.test(rawPhone)) {
                boundPhone = `+${rawPhone}`;
              }
            } catch (e) {}
          }

          // Check if already in existing list
          const foundInExisting = existing.find((e) => e.id === chanId);
          if (foundInExisting) {
            discovered.push({
              ...foundInExisting,
              boundPhone: boundPhone || foundInExisting.boundPhone,
            });
          } else {
            discovered.push({
              id: chanId,
              name,
              type: "WHATSAPP",
              autoReplyEnabled: autoReply,
              boundPhone,
              timeoutSeconds,
              sessionTimeoutSeconds,
              systemPrompt,
              model,
              replyMode,
              whitelist,
              blacklist,
              commandPrefix,
              allowPrivate,
              allowGroup,
              createdAt,
              updatedAt: createdAt,
            });
          }
        }
      }
    }
  } catch (e) {
    console.error("[Channels Persistence] Error scanning WhatsApp auth directory:", e);
  }

  // 2. Scan Telegram sessions
  try {
    const tgAuthBase = path.join(process.cwd(), "auth", "telegram");
    if (fs.existsSync(tgAuthBase)) {
      const dirs = fs.readdirSync(tgAuthBase);
      for (const chanId of dirs) {
        if (chanId === "default" && dirs.length > 1) continue;
        const dirPath = path.join(tgAuthBase, chanId);
        const configFile = path.join(dirPath, "telegram_config.json");

        if (fs.existsSync(configFile)) {
          try {
            const cfg = JSON.parse(fs.readFileSync(configFile, "utf-8"));
            if (cfg.botToken && cfg.botToken.length > 5) {
              const name = cfg.name || `Telegram Bot`;
              const autoReply = typeof cfg.autoReplyEnabled === "boolean" ? cfg.autoReplyEnabled : true;
              const systemPrompt = cfg.systemPrompt || undefined;
              const model = cfg.model || undefined;
              const timeoutSeconds = typeof cfg.responseTimeout === "number" ? cfg.responseTimeout : 30;
              const sessionTimeoutSeconds = typeof cfg.sessionTimeout === "number" ? cfg.sessionTimeout : 300;
              const createdAt = cfg.createdAt || new Date().toISOString();

              const foundInExisting = existing.find((e) => e.id === chanId);
              if (foundInExisting) {
                discovered.push(foundInExisting);
              } else {
                discovered.push({
                  id: chanId,
                  name,
                  type: "TELEGRAM",
                  autoReplyEnabled: autoReply,
                  timeoutSeconds,
                  sessionTimeoutSeconds,
                  systemPrompt,
                  model,
                  replyMode: "all",
                  commandPrefix: cfg.commandPrefix !== undefined ? cfg.commandPrefix : ".ai",
                  createdAt,
                  updatedAt: createdAt,
                });
              }
            }
          } catch (e) {}
        }
      }
    }
  } catch (e) {
    console.error("[Channels Persistence] Error scanning Telegram auth directory:", e);
  }

  return discovered;
}
