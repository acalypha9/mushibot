"use client";

import React from "react";
import { CronReminderItem } from "../types";
import { Radio } from "lucide-react";

interface ReminderRowChannelsProps {
  rem: CronReminderItem;
}

export default function ReminderRowChannels({ rem }: ReminderRowChannelsProps) {
  const meta =
    typeof rem.cmetadata === "object" && rem.cmetadata !== null && !Array.isArray(rem.cmetadata)
      ? (rem.cmetadata as Record<string, unknown>)
      : undefined;

  const rawRecMeta = meta?._recipients;
  const recMeta =
    typeof rawRecMeta === "object" && rawRecMeta !== null && !Array.isArray(rawRecMeta)
      ? (rawRecMeta as Record<string, unknown>)
      : undefined;

  const isAllRecipients =
    rem.target_recipients?.startsWith("ALL") ||
    recMeta?.mode === "all";

  const rawGroupSubjects = recMeta?.group_subjects ?? meta?.group_subjects;
  const groupSubjects =
    typeof rawGroupSubjects === "object" && rawGroupSubjects !== null && !Array.isArray(rawGroupSubjects)
      ? (rawGroupSubjects as Record<string, string>)
      : undefined;

  const displayRecipients = React.useMemo(() => {
    if (!rem.target_recipients) return "All Channel Members";
    if (
      !groupSubjects ||
      typeof groupSubjects !== "object" ||
      Array.isArray(groupSubjects) ||
      Object.keys(groupSubjects).length === 0
    ) {
      return rem.target_recipients;
    }

    let text = rem.target_recipients;
    for (const [jid, subject] of Object.entries(groupSubjects)) {
      if (typeof jid === "string" && typeof subject === "string" && jid && subject) {
        text = text.split(jid).join(subject);
      }
    }
    return text;
  }, [rem.target_recipients, groupSubjects]);

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
        title={displayRecipients}
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
            <span>{displayRecipients}</span>
          </span>
        ) : (
          <span>{rem.target_recipients ? `To: ${displayRecipients}` : "All Channel Members"}</span>
        )}
      </div>
    </div>
  );
}
