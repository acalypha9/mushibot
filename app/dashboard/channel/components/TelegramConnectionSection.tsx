"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Send, RefreshCw, Power } from "lucide-react";
import { ChannelItem, TelegramStatus } from "../types";
import {
  getConnectionStatusText,
  getConnectionBadgeStyle,
  getTelegramBotDisplay,
} from "./connectionHelpers";

export interface TelegramConnectionSectionProps {
  selectedChannel: ChannelItem;
  cfgTgToken: string;
  setCfgTgToken: (token: string) => void;
  isChannelConnected: boolean;
  statusText: string;
  tgStatus: TelegramStatus | null;
  telegramStatusesMap: Record<string, TelegramStatus>;
  tgActionLoading: string | null;
  setTgActionLoading: (loading: string | null) => void;
  setTgStatus: (status: TelegramStatus | null) => void;
  setTelegramStatusesMap: (fn: (prev: Record<string, TelegramStatus>) => Record<string, TelegramStatus>) => void;
  setErrorMsg: (msg: string | null) => void;
  setSuccessMsg: (msg: string | null) => void;
  cfgAutoReply: boolean;
  cfgSystemPrompt: string;
  cfgModel: string;
  cfgTimeout: number;
  cfgSessionTimeout: number;
}

export const TelegramConnectionSection: React.FC<TelegramConnectionSectionProps> = ({
  selectedChannel,
  cfgTgToken,
  setCfgTgToken,
  isChannelConnected,
  statusText,
  tgStatus,
  telegramStatusesMap,
  tgActionLoading,
  setTgActionLoading,
  setTgStatus,
  setTelegramStatusesMap,
  setErrorMsg,
  setSuccessMsg,
  cfgAutoReply,
  cfgSystemPrompt,
  cfgModel,
  cfgTimeout,
  cfgSessionTimeout,
}) => {
  const displayStatus = getConnectionStatusText(isChannelConnected, statusText);
  const badgeStyle = getConnectionBadgeStyle({ isWa: false, isConnected: isChannelConnected });
  const botInfo = getTelegramBotDisplay(
    telegramStatusesMap[selectedChannel.id],
    tgStatus
  );

  const handleDisconnect = async () => {
    setTgActionLoading("disconnect");
    try {
      const res = await fetch("/api/channel/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect", channel_id: selectedChannel.id }),
      });
      const data = await res.json();
      setTgStatus(data);
      setTelegramStatusesMap((prev) => ({ ...prev, [selectedChannel.id]: data }));
    } catch {
    } finally {
      setTgActionLoading(null);
    }
  };

  const handleConnect = async () => {
    if (!cfgTgToken.trim()) return;
    setTgActionLoading("connect");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/channel/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "connect",
          channel_id: selectedChannel.id,
          token: cfgTgToken.trim(),
          autoReply: cfgAutoReply,
          systemPrompt: cfgSystemPrompt,
          model: cfgModel,
          timeoutSeconds: Number(cfgTimeout),
          sessionTimeoutSeconds: Number(cfgSessionTimeout),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to connect Telegram Bot");
      setTgStatus(data);
      setTelegramStatusesMap((prev) => ({ ...prev, [selectedChannel.id]: data }));
      if (data.status === "CONNECTED") {
        setSuccessMsg("Telegram Bot connected successfully via GrammY!");
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to connect Telegram Bot.");
    } finally {
      setTgActionLoading(null);
    }
  };

  return (
    <div
      style={{
        background: "var(--muted)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        marginTop: "4px",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Send style={{ width: "14px", height: "14px", color: isChannelConnected ? "#229ED9" : "var(--muted-foreground)" }} />
          <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--muted-foreground)" }}>
            Telegram Bot Status:
          </span>
          <span
            style={{
              padding: "1px 6px",
              borderRadius: "8px",
              fontSize: "10px",
              fontWeight: "600",
              ...badgeStyle,
            }}
          >
            {displayStatus}
          </span>
        </div>

        {isChannelConnected && (
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={handleDisconnect}
            disabled={tgActionLoading === "disconnect"}
          >
            <Power style={{ width: "12px", height: "12px" }} />
            <span>Disconnect Bot</span>
          </Button>
        )}
      </div>

      <div>
        <label style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
          Telegram Bot Token *
        </label>
        <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
          <Input
            type="password"
            name="telegram_bot_auth_token"
            autoComplete="off"
            data-form-type="other"
            data-lpignore="true"
            data-1p-ignore="true"
            data-bwignore="true"
            data-dashlane-ignore="true"
            placeholder="YOUR TOKEN..."
            value={cfgTgToken}
            onChange={(e) => setCfgTgToken(e.target.value)}
            disabled={Boolean(isChannelConnected)}
            style={{
              flex: 1,
              fontFamily: "var(--font-mono)",
            }}
          />
          {!isChannelConnected && (
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleConnect}
              disabled={tgActionLoading === "connect" || !cfgTgToken.trim()}
            >
              {tgActionLoading === "connect" ? (
                <>
                  <RefreshCw style={{ width: "14px", height: "14px", animation: "spin 1s linear infinite" }} />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Send style={{ width: "14px", height: "14px" }} />
                  <span>Connect Bot</span>
                </>
              )}
            </Button>
          )}
        </div>
        <span style={{ fontSize: "11px", color: "var(--muted-foreground)", marginTop: "4px", display: "block" }}>
          Obtain your Telegram Bot Token from <strong>@BotFather</strong> on Telegram.
        </span>
      </div>

      {isChannelConnected && (telegramStatusesMap[selectedChannel.id]?.botInfo || tgStatus?.botInfo) && (
        <div style={{ fontSize: "12px", color: "#0369a1", fontWeight: "600", display: "flex", alignItems: "center", gap: "10px" }}>
          <span>
            Bot Account: <strong>@{botInfo.username}</strong> ({botInfo.firstName})
          </span>
        </div>
      )}
    </div>
  );
};
