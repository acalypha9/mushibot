"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { Edit3, Trash2, Smartphone, Bot, Send } from "lucide-react";
import {
  ChannelItem,
  WhatsAppStatus,
  TelegramStatus,
  ModelOptionItem,
  getChannelModelDisplay,
  getChannelCardStatus,
} from "../types";
import { TelegramIcon, WhatsAppIcon } from "./ChannelIcons";

export interface ChannelCardProps {
  channel: ChannelItem;
  selectedChannel: ChannelItem | null;
  waStatus: WhatsAppStatus | null;
  tgStatus: TelegramStatus | null;
  waStatusesMap: Record<string, WhatsAppStatus>;
  telegramStatusesMap: Record<string, TelegramStatus>;
  configuredModelsList: ModelOptionItem[];
  defaultModelName: string;
  onSelectChannel: (channel: ChannelItem, tab?: "overview" | "connection" | "message" | "bot" | "broadcast") => void;
  onOpenDeleteModal: (channel: ChannelItem) => void;
}

export default function ChannelCard({
  channel,
  selectedChannel,
  waStatus,
  tgStatus,
  waStatusesMap,
  telegramStatusesMap,
  configuredModelsList,
  defaultModelName,
  onSelectChannel,
  onOpenDeleteModal,
}: ChannelCardProps) {
  const isWa = channel.type === "WHATSAPP";
  const isTg = channel.type === "TELEGRAM";
  const { isConnected, phoneNum, tgUsername } = getChannelCardStatus({
    channel,
    selectedChannel,
    waStatus,
    tgStatus,
    waStatusesMap,
    telegramStatusesMap,
  });

  return (
    <div
      onClick={() => onSelectChannel(channel, "overview")}
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: "20px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "var(--shadow-sm)",
        cursor: "pointer",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--secondary)";
        e.currentTarget.style.boxShadow = "var(--shadow-md)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.boxShadow = "var(--shadow-sm)";
      }}
    >
      {/* Left side: Icon & Title/Metadata */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "10px",
            background: isWa ? "rgba(37, 211, 102, 0.12)" : "rgba(34, 158, 217, 0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: isWa ? "#25D366" : "#229ED9",
            flexShrink: 0,
          }}
        >
          {isWa ? (
            <WhatsAppIcon style={{ width: "24px", height: "24px" }} />
          ) : (
            <TelegramIcon style={{ width: "24px", height: "24px" }} />
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                color: "var(--foreground)",
                margin: 0,
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              }}
            >
              {channel.name}
            </h3>

            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "2px 10px",
                borderRadius: "12px",
                fontSize: "11px",
                fontWeight: "700",
                background: isConnected
                  ? isWa
                    ? "rgba(37, 211, 102, 0.15)"
                    : "rgba(34, 158, 217, 0.15)"
                  : "rgba(100, 116, 139, 0.12)",
                color: isConnected
                  ? isWa
                    ? "#25D366"
                    : "#229ED9"
                  : "var(--muted-foreground)",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: isConnected
                    ? isWa
                      ? "#25D366"
                      : "#229ED9"
                    : "#64748b",
                }}
              />
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>

          <div style={{ fontSize: "13px", color: "var(--muted-foreground)", margin: 0 }}>
            {channel.description || "No description specified"}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "12px", color: "var(--muted-foreground)", marginTop: "4px" }}>
            {isWa && isConnected && phoneNum && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Smartphone style={{ width: "14px", height: "14px", color: "#25D366" }} />
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{phoneNum}</span>
              </div>
            )}

            {isTg && isConnected && tgUsername && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Send style={{ width: "14px", height: "14px", color: "#229ED9" }} />
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>@{tgUsername}</span>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Bot style={{ width: "14px", height: "14px", color: "var(--primary)" }} />
              <span>
                Chat Model: <strong>{getChannelModelDisplay(channel.model, configuredModelsList, defaultModelName)}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onSelectChannel(channel, "connection");
          }}
          title="Channel Configuration"
          style={{ padding: "6px", minWidth: "auto", height: "auto" }}
        >
          <Edit3 style={{ width: "18px", height: "18px" }} />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDeleteModal(channel);
          }}
          title="Remove Channel"
          style={{ padding: "6px", minWidth: "auto", height: "auto" }}
        >
          <Trash2 style={{ width: "18px", height: "18px" }} />
        </Button>
      </div>
    </div>
  );
}
