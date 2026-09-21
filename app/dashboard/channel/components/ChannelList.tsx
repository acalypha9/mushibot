"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { Plus, AlertCircle } from "lucide-react";
import { ChannelItem, WhatsAppStatus, TelegramStatus, ModelOptionItem } from "../types";
import ChannelCard from "./ChannelCard";

export { TelegramIcon, WhatsAppIcon } from "./ChannelIcons";

export interface ChannelListProps {
  channels: ChannelItem[];
  selectedChannel: ChannelItem | null;
  waStatus: WhatsAppStatus | null;
  tgStatus: TelegramStatus | null;
  waStatusesMap: Record<string, WhatsAppStatus>;
  telegramStatusesMap: Record<string, TelegramStatus>;
  configuredModelsList: ModelOptionItem[];
  defaultModelName: string;
  errorMsg: string | null;
  onSelectChannel: (channel: ChannelItem, tab?: "overview" | "connection" | "message" | "bot" | "broadcast") => void;
  onOpenAddModal: () => void;
  onOpenDeleteModal: (channel: ChannelItem) => void;
}

export default function ChannelList({
  channels,
  selectedChannel,
  waStatus,
  tgStatus,
  waStatusesMap,
  telegramStatusesMap,
  configuredModelsList,
  defaultModelName,
  errorMsg,
  onSelectChannel,
  onOpenAddModal,
  onOpenDeleteModal,
}: ChannelListProps) {
  return (
    <div
      style={{
        minHeight: "100%",
        backgroundColor: "#faf9f8",
        padding: "28px 40px 60px 40px",
        boxSizing: "border-box",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: "#323130",
      }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#323130", marginTop: "4px", letterSpacing: "-0.01em" }}>
              Channel
            </h1>
            <p style={{ fontSize: "13px", color: "#605e5c", marginTop: "4px" }}>
              Manage all your channel configurations, integrations, and messaging tools.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={onOpenAddModal}
          >
            <Plus style={{ width: "16px", height: "16px" }} />
            <span>Add Channel</span>
          </Button>
        </header>

        {errorMsg && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "8px",
              background: "#fef2f2",
              border: "1px solid #fca5a5",
              color: "#b91c1c",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <AlertCircle style={{ width: "16px", height: "16px", flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* CHANNELS LIST CARDS */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {channels.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", border: "1px dashed var(--border)", borderRadius: "var(--radius-md)", opacity: 0.5 }}>
              No channels configured. Click &quot;+ Add Channel&quot; above to add one.
            </div>
          ) : (
            channels.map((chan) => (
              <ChannelCard
                key={chan.id}
                channel={chan}
                selectedChannel={selectedChannel}
                waStatus={waStatus}
                tgStatus={tgStatus}
                waStatusesMap={waStatusesMap}
                telegramStatusesMap={telegramStatusesMap}
                configuredModelsList={configuredModelsList}
                defaultModelName={defaultModelName}
                onSelectChannel={onSelectChannel}
                onOpenDeleteModal={onOpenDeleteModal}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
