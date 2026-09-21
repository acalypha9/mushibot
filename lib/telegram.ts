import { Bot } from "grammy";
import fs from "fs";
import path from "path";
import {
  type TelegramStatus,
  getOrCreateStore,
  savePersistedConfig,
  formatTelegramStatus,
  removeAuthFolder,
} from "./telegram-store";

export type { TelegramStatus };

export function getTelegramStatus(channelId?: string): TelegramStatus {
  const store = getOrCreateStore(channelId);
  const now = Date.now();
  const canAttemptAutoConnect =
    !store.autoConnectFailed &&
    (!store.lastConnectAttempt || now - store.lastConnectAttempt > 60000);

  if (
    store.botToken &&
    store.status === "DISCONNECTED" &&
    !store.bot &&
    !store.userIntentDisconnect &&
    !store.isInitializing &&
    canAttemptAutoConnect
  ) {
    console.log(`[Telegram Auto-Connect] Found saved token for ${store.sessionId}. Auto-connecting GrammY bot...`);
    initTelegramBot(channelId, store.botToken).catch((err) =>
      console.error(`[Telegram Auto-Connect Error ${store.sessionId}]:`, err)
    );
  }

  return formatTelegramStatus(store);
}

export async function initTelegramBot(channelId: string = "default", token?: string): Promise<TelegramStatus> {
  const store = getOrCreateStore(channelId);
  const targetToken = token?.trim() || store.botToken;

  if (!targetToken) {
    store.status = "DISCONNECTED";
    store.lastError = "Bot token is required to connect to Telegram.";
    return formatTelegramStatus(store);
  }

  store.userIntentDisconnect = false;
  store.isInitializing = true;
  store.lastConnectAttempt = Date.now();

  // Always stop existing bot instance so latest command listeners apply
  if (store.bot) {
    try {
      await store.bot.stop();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.warn(`[Telegram Init ${store.sessionId}] Error stopping existing bot:`, message);
    }
    store.bot = null;
  }

  store.status = "CONNECTING";
  store.lastError = null;

  try {
    const bot = new Bot(targetToken);
    const me = await bot.api.getMe();

    store.botInfo = {
      id: me.id,
      username: me.username,
      firstName: me.first_name,
    };
    store.botToken = targetToken;
    store.autoConnectFailed = false;
    savePersistedConfig(store);

    // Register Telegram Bot Command Menu
    bot.api.setMyCommands([
      { command: "start", description: "Start the bot" },
      { command: "help", description: "Get help & instructions" },
      { command: "reset", description: "Reset chat session" },
    ]).catch((err) => console.error(`[Telegram setMyCommands Error ${store.sessionId}]:`, err));

    // Handle /start command
    bot.command("start", async (ctx) => {
      console.log(`[Telegram Command /start ${store.sessionId}] Handled natively.`);
      await ctx.reply("Welcome!");
    });

    // Handle /help command
    bot.command("help", async (ctx) => {
      console.log(`[Telegram Command /help ${store.sessionId}] Handled natively.`);
      await ctx.reply("Available commands:\n/start - Start the bot\n/help - Get help\n/reset - Reset chat session");
    });

    // Handle /reset command
    bot.command("reset", async (ctx) => {
      console.log(`[Telegram Command /reset ${store.sessionId}] Handled natively.`);
      await ctx.reply("Chat session reset.");
    });

    bot.on("message:text", async (ctx) => {
      const textContent = ctx.message.text?.trim() || "";
      const senderId = String(ctx.from.id);
      const pushName = ctx.from.first_name || ctx.from.username || "Telegram User";

      const isBotCommand = textContent.startsWith("/") || ctx.message.entities?.some((e) => e.type === "bot_command");
      if (isBotCommand) {
        console.log(`[Telegram Session ${store.sessionId}] Command received (${textContent}). Handled natively.`);
        return;
      }

      console.log(`[Telegram Incoming Session ${store.sessionId}] From Chat ${ctx.chat.id} (Sender: ${senderId}, Name: ${pushName}): ${textContent}`);
      // NO LLM INVOCATION - Pure GrammY Telegram Channel Engine
    });

    bot.catch((err) => {
      console.error(`[Telegram Bot Error ${store.sessionId}]:`, err);
    });

    // Start bot long polling in background
    bot.start({
      onStart: (botInfo) => {
        console.log(`[Telegram Bot Connected] @${botInfo.username} (ID: ${botInfo.id}) for session ${store.sessionId}`);
        store.status = "CONNECTED";
      },
    });

    store.bot = bot;
    store.status = "CONNECTED";
    store.isInitializing = false;
    return formatTelegramStatus(store);
  } catch (err) {
    store.status = "DISCONNECTED";
    store.isInitializing = false;
    store.autoConnectFailed = true;

    let errMsg = err instanceof Error ? err.message : "Failed to initialize Telegram bot.";
    if (errMsg.includes("ENOTFOUND") || errMsg.includes("getaddrinfo") || errMsg.includes("getMe failed")) {
      errMsg = "Network request to api.telegram.org failed (ENOTFOUND). Please check internet connection or DNS/firewall settings.";
    }
    store.lastError = errMsg;
    console.error(`[Telegram Auto-Connect Error ${store.sessionId}]:`, errMsg);
    return formatTelegramStatus(store);
  }
}

export async function disconnectTelegram(channelId: string = "default"): Promise<TelegramStatus> {
  const store = getOrCreateStore(channelId);
  store.userIntentDisconnect = true;
  store.autoConnectFailed = false;
  if (store.bot) {
    try {
      await store.bot.stop();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.warn(`[Telegram Disconnect ${store.sessionId}] Error stopping bot:`, message);
    }
    store.bot = null;
  }
  store.status = "DISCONNECTED";
  store.botToken = null;
  store.botInfo = null;
  savePersistedConfig(store);
  removeAuthFolder(channelId);
  return formatTelegramStatus(store);
}

export function setTelegramConfig(
  channelId: string = "default",
  enabled = true,
  systemPrompt?: string,
  model?: string,
  responseTimeout?: number,
  sessionTimeout?: number
): TelegramStatus {
  const store = getOrCreateStore(channelId);
  store.autoReplyEnabled = enabled;
  if (systemPrompt !== undefined) store.systemPrompt = systemPrompt;
  if (model !== undefined) store.model = model;
  if (typeof responseTimeout === "number" && responseTimeout > 0) store.responseTimeout = responseTimeout;
  if (typeof sessionTimeout === "number" && sessionTimeout > 0) store.sessionTimeout = sessionTimeout;
  savePersistedConfig(store);
  return formatTelegramStatus(store);
}

export async function sendTelegramBroadcast(
  channelId: string = "default",
  recipients: string[] = [],
  text: string = ""
): Promise<{ success: boolean; sentCount: number; errors: string[] }> {
  const store = getOrCreateStore(channelId);
  if (!store.bot || store.status !== "CONNECTED") {
    throw new Error(`Telegram bot for session ${store.sessionId} is not connected.`);
  }

  let sentCount = 0;
  const errors: string[] = [];

  for (const recipient of recipients) {
    try {
      const chatId = recipient.trim();
      if (!chatId) continue;
      await store.bot.api.sendMessage(chatId, text);
      sentCount++;
    } catch (err) {
      errors.push(`Failed to send to ${recipient}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { success: sentCount > 0, sentCount, errors };
}

// Auto-connect background worker for ALL existing Telegram session directories on startup
if (typeof window === "undefined" && process.env.NODE_ENV !== "test") {
  setTimeout(() => {
    try {
      const tgAuthBase = path.join(process.cwd(), "auth", "telegram");
      if (fs.existsSync(tgAuthBase)) {
        const sessionDirs = fs.readdirSync(tgAuthBase);
        for (const chanId of sessionDirs) {
          const st = getOrCreateStore(chanId);
          if (st.botToken && st.status === "DISCONNECTED" && !st.userIntentDisconnect && !st.autoConnectFailed) {
            console.log(`[Telegram Startup Worker] Found saved session for ${chanId}. Auto-connecting bot...`);
            initTelegramBot(chanId, st.botToken).catch((err) =>
              console.error(`[Telegram Startup Error ${chanId}]:`, err)
            );
          }
        }
      }
    } catch (e) {
      console.error("[Telegram Startup Scan Error]:", e);
    }
  }, 1000);
}
