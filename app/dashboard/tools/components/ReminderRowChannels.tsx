"use client";

import React from "react";
import { CronReminderItem } from "../types";
import { Radio } from "lucide-react";

interface ReminderRowChannelsProps {
  rem: CronReminderItem;
}

export default function ReminderRowChannels({ rem }: ReminderRowChannelsProps) {
  const isAllRecipients =
    rem.target_recipients?.startsWith("ALL") ||
    ((rem.cmetadata as Record<string, unknown>)?._recipients as Record<string, unknown> | undefined)?.mode === "all";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {rem.channel_type === "WHATSAPP" && (
          <span
            style={{
              padding: "2px 8px",
              borderRadius: "12px",
              background: "#dcfce7",
              color: "#15803d",
              fontSize: "11px",
              fontWeight: "700",
            }}
          >
            WhatsApp
          </span>
        )}
        {rem.channel_type === "TELEGRAM" && (
          <span
            style={{
              padding: "2px 8px",
              borderRadius: "12px",
              background: "#e0f2fe",
              color: "#0369a1",
              fontSize: "11px",
              fontWeight: "700",
            }}
          >
            Telegram
          </span>
        )}
      </div>
      <div
        style={{
          fontSize: "11.5px",
          color: "#605e5c",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: "190px",
        }}
        title={rem.target_recipients || "All channel members"}
      >
        {isAllRecipients ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              color: "#742774",
              fontWeight: "600",
            }}
          >
            <Radio style={{ width: "11px", height: "11px" }} />
            <span>{rem.target_recipients || "All Channel Members"}</span>
          </span>
        ) : (
          <span>{rem.target_recipients ? `To: ${rem.target_recipients}` : "All Channel Members"}</span>
        )}
      </div>
    </div>
  );
}
