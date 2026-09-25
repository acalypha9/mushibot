"use client";

import React from "react";
import { CronReminderItem } from "../types";
import ReminderRowChannels from "./ReminderRowChannels";
import ReminderRowActions from "./ReminderRowActions";
import { formatCronHuman, getTimezoneGmtLabel, formatAnyDateInText } from "../utils";
import { isSafeReminderUrl } from "../api_contracts";
import { formatDateTimeCustom } from "@/lib/utils/formatters";
import { ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/Input";

interface ReminderRowProps {
  rem: CronReminderItem;
  isSelectedRow: boolean;
  onSelectOne: (id: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  isTriggering: boolean;
  onToggleStatus: (rem: CronReminderItem, e?: React.SyntheticEvent) => void;
  onTriggerNow: (rem: CronReminderItem, e?: React.MouseEvent) => void;
  onOpenEditModal: (rem: CronReminderItem) => void;
  onDeleteTarget: (rem: CronReminderItem) => void;
}

export default function ReminderRow({
  rem,
  isSelectedRow,
  onSelectOne,
  isTriggering,
  onToggleStatus,
  onTriggerNow,
  onOpenEditModal,
  onDeleteTarget,
}: ReminderRowProps) {
  const linkUrl = typeof rem.cmetadata?.link === "string" ? rem.cmetadata.link : typeof rem.cmetadata?.meeting_url === "string" ? rem.cmetadata.meeting_url : typeof rem.cmetadata?.url === "string" ? rem.cmetadata.url : "";
  const rawDesc = rem.description || (typeof rem.cmetadata?.description === "string" ? rem.cmetadata.description : typeof rem.cmetadata?.desc === "string" ? rem.cmetadata.desc : "");
  const descText = typeof rawDesc === "string" ? rawDesc : "";

  const runsMeta = (() => {
    const cMeta = (rem.cmetadata || {}) as Record<string, unknown>;
    const sched = cMeta._schedule as Record<string, unknown> | undefined;
    const maxRuns = sched?.max_runs ?? cMeta.max_runs ?? 1;
    const limit = Math.max(1, parseInt(String(maxRuns), 10) || 1);

    const tz = rem.timezone || "Asia/Jakarta";
    let todayStr = "";
    try {
      todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());
    } catch {
      todayStr = new Date().toISOString().slice(0, 10);
    }

    const dailyRunsMeta = cMeta._daily_runs as Record<string, unknown> | undefined;
    let runsToday = 0;
    if (dailyRunsMeta && typeof dailyRunsMeta === "object" && dailyRunsMeta.date === todayStr) {
      runsToday = Math.min(limit, Number(dailyRunsMeta.count) || 0);
    } else if (rem.last_run_at) {
      let lastRunDateStr = "";
      try {
        lastRunDateStr = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date(rem.last_run_at));
      } catch {
        lastRunDateStr = new Date(rem.last_run_at).toISOString().slice(0, 10);
      }
      if (lastRunDateStr === todayStr) {
        runsToday = Math.min(limit, rem.run_count || 1);
      }
    }
    return `${runsToday}/${limit} runs`;
  })();

  return (
    <tr
      style={{
        borderBottom: "1px solid #f3f2f1",
        background: isSelectedRow ? "#efe5ef" : "transparent",
        transition: "background 0.15s ease",
        opacity: rem.is_active ? 1 : 0.65,
      }}
      onMouseEnter={(e) => {
        if (!isSelectedRow) e.currentTarget.style.background = "#faf9f8";
      }}
      onMouseLeave={(e) => {
        if (!isSelectedRow) e.currentTarget.style.background = "transparent";
      }}
    >
      {/* Selection Checkbox */}
      <td style={{ padding: "12px 16px", width: "40px" }}>
        <Input
          type="checkbox"
          checked={isSelectedRow}
          onChange={(e) => onSelectOne(rem.id, e)}
          style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "#742774" }}
        />
      </td>

      {/* Title & Info */}
      <td style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontWeight: "700", color: "#323130", fontSize: "13.5px" }}>
              {rem.title}
            </span>
            {rem.last_status === "SUCCESS" && (
              <span
                title="Last execution succeeded"
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#16a34a",
                  display: "inline-block",
                }}
              />
            )}
            {rem.last_status === "FAILED" && (
              <span
                title={`Last execution failed: ${rem.last_error || "Error"}`}
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#dc2626",
                  display: "inline-block",
                }}
              />
            )}
          </div>
          {descText && (
            <div
              style={{
                fontSize: "12px",
                color: "#605e5c",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "230px",
              }}
            >
              {formatAnyDateInText(descText)}
            </div>
          )}
          {isSafeReminderUrl(linkUrl) && (
            <a
              href={linkUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: "11px",
                color: "#742774",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontWeight: "600",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink style={{ width: "11px", height: "11px" }} />
              <span>Link</span>
            </a>
          )}
        </div>
      </td>

      {/* Schedule */}
      <td data-label="Schedule" style={{ padding: "12px 16px" }}>
        <div style={{ fontSize: "12.5px", color: "#323130", fontWeight: "600" }}>
          {formatCronHuman(rem.cron_expression, rem.cmetadata)}
        </div>
        <div style={{ fontSize: "11px", color: "#605e5c", marginTop: "2px" }}>
          {getTimezoneGmtLabel(rem.timezone || "Asia/Jakarta")}
        </div>
      </td>

      {/* Channel Target */}
      <td data-label="Channel" style={{ padding: "12px 16px" }}>
        <ReminderRowChannels rem={rem} />
      </td>

      {/* Next Run */}
      <td data-label="Next run" style={{ padding: "12px 16px", color: "#323130", fontSize: "12px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <div style={{ fontWeight: "600", color: rem.is_active ? "#323130" : "#a19f9d" }}>
            {rem.is_active ? formatDateTimeCustom(rem.next_run_at) : "Disabled"}
          </div>
          <div style={{ fontSize: "11px", color: "#605e5c" }}>
            {rem.last_run_at ? `Last: ${formatDateTimeCustom(rem.last_run_at)} • ` : ""}
            {runsMeta}
          </div>
        </div>
      </td>

      {/* Status Toggle Switch */}
      <td data-label="Status" style={{ padding: "12px 16px", textAlign: "center", width: "90px" }} onClick={(e) => e.stopPropagation()}>
        <label
          style={{
            position: "relative",
            display: "inline-block",
            width: "42px",
            height: "22px",
            cursor: "pointer",
          }}
          title={rem.is_active ? "Enabled" : "Disabled"}
        >
          <input
            type="checkbox"
            checked={rem.is_active}
            onChange={(e) => onToggleStatus(rem, e)}
            style={{ opacity: 0, width: 0, height: 0, position: "absolute" }}
          />
          <span
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: rem.is_active ? "#742774" : "#e2e8f0",
              transition: ".2s",
              borderRadius: "22px",
            }}
          >
            <span
              style={{
                position: "absolute",
                content: '""',
                height: "16px",
                width: "16px",
                left: rem.is_active ? "23px" : "3px",
                bottom: "3px",
                backgroundColor: "#ffffff",
                transition: ".2s",
                borderRadius: "50%",
                boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
              }}
            />
          </span>
        </label>
      </td>

      {/* Actions */}
      <td data-label="Actions" style={{ padding: "12px 16px", textAlign: "right" }}>
        <ReminderRowActions
          rem={rem}
          isTriggering={isTriggering}
          onTriggerNow={onTriggerNow}
          onOpenEditModal={onOpenEditModal}
          onDeleteTarget={onDeleteTarget}
        />
      </td>
    </tr>
  );
}
