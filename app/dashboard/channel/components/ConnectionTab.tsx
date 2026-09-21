"use client";

import React from "react";
import { Input } from "@/components/ui/Input";
import { ChannelItem, WhatsAppStatus, TelegramStatus } from "../types";
import { ConnectionHeader } from "./ConnectionHeader";
import { WhatsAppConnectionSection } from "./WhatsAppConnectionSection";
import { TelegramConnectionSection } from "./TelegramConnectionSection";

export interface ConnectionTabProps {
  selectedChannel: ChannelItem;
  cfgName: string;
  setCfgName: (name: string) => void;
  cfgDesc: string;
  setCfgDesc: (desc: string) => void;
  cfgTgToken: string;
  setCfgTgToken: (token: string) => void;
  isWa: boolean;
  isChannelConnected: boolean;
  statusText: string;
  hasUnsavedConnectionChanges: boolean;
  isSaved: boolean;
  resetSuccessMsg: string | null;
  resettingConversations: boolean;
  onOpenResetConfirm: () => void;
  onSaveAllConfig: (e?: React.FormEvent) => void;
  // WhatsApp-specific
  actionLoading: string | null;
  isWaConnecting: boolean;
  isWaQR: boolean;
  showPairingQR: boolean;
  setShowPairingQR: (show: boolean) => void;
  setActiveQrUrl: (url: string | null) => void;
  setQrExpired: (expired: boolean) => void;
  setQrTimer: (timer: number | ((prev: number) => number)) => void;
  qrExpired: boolean;
  qrTimer: number;
  waStatus: WhatsAppStatus | null;
  handleWaAction: (
    action: "connect" | "disconnect" | "reset" | "toggle_autoreply",
    autoReplyVal?: boolean,
    systemPromptVal?: string,
    modelVal?: string
  ) => Promise<void>;
  // Telegram-specific
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

export default function ConnectionTab({
  selectedChannel,
  cfgName,
  setCfgName,
  cfgDesc,
  setCfgDesc,
  cfgTgToken,
  setCfgTgToken,
  isWa,
  isChannelConnected,
  statusText,
  hasUnsavedConnectionChanges,
  isSaved,
  resetSuccessMsg,
  resettingConversations,
  onOpenResetConfirm,
  onSaveAllConfig,
  actionLoading,
  isWaConnecting,
  isWaQR,
  showPairingQR,
  setShowPairingQR,
  setActiveQrUrl,
  setQrExpired,
  setQrTimer,
  qrExpired,
  qrTimer,
  waStatus,
  handleWaAction,
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
}: ConnectionTabProps) {
  return (
    <form
      onSubmit={onSaveAllConfig}
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "18px",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <ConnectionHeader
        hasUnsavedConnectionChanges={hasUnsavedConnectionChanges}
        isSaved={isSaved}
        resetSuccessMsg={resetSuccessMsg}
        resettingConversations={resettingConversations}
        onOpenResetConfirm={onOpenResetConfirm}
      />

      <div>
        <label style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "#605e5c" }}>
          Channel Name *
        </label>
        <Input
          required
          type="text"
          value={cfgName}
          onChange={(e) => setCfgName(e.target.value)}
        />
      </div>

      <div>
        <label style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
          Description
        </label>
        <Input
          type="text"
          placeholder="Enter channel description..."
          value={cfgDesc}
          onChange={(e) => setCfgDesc(e.target.value)}
        />
      </div>

      {isWa && (
        <WhatsAppConnectionSection
          isChannelConnected={isChannelConnected}
          statusText={statusText}
          actionLoading={actionLoading}
          isWaConnecting={isWaConnecting}
          isWaQR={isWaQR}
          showPairingQR={showPairingQR}
          setShowPairingQR={setShowPairingQR}
          setActiveQrUrl={setActiveQrUrl}
          setQrExpired={setQrExpired}
          setQrTimer={setQrTimer}
          qrExpired={qrExpired}
          qrTimer={qrTimer}
          waStatus={waStatus}
          handleWaAction={handleWaAction}
        />
      )}

      {selectedChannel.type === "TELEGRAM" && (
        <TelegramConnectionSection
          selectedChannel={selectedChannel}
          cfgTgToken={cfgTgToken}
          setCfgTgToken={setCfgTgToken}
          isChannelConnected={isChannelConnected}
          statusText={statusText}
          tgStatus={tgStatus}
          telegramStatusesMap={telegramStatusesMap}
          tgActionLoading={tgActionLoading}
          setTgActionLoading={setTgActionLoading}
          setTgStatus={setTgStatus}
          setTelegramStatusesMap={setTelegramStatusesMap}
          setErrorMsg={setErrorMsg}
          setSuccessMsg={setSuccessMsg}
          cfgAutoReply={cfgAutoReply}
          cfgSystemPrompt={cfgSystemPrompt}
          cfgModel={cfgModel}
          cfgTimeout={cfgTimeout}
          cfgSessionTimeout={cfgSessionTimeout}
        />
      )}
    </form>
  );
}
