"use client";

import React from "react";
import { CronReminderItem, ChannelOption } from "../types";
import { Clock, CheckCircle2, Send, Bell } from "lucide-react";

interface ReminderKpiStatsProps {
  reminders: CronReminderItem[];
  availableChannels: ChannelOption[];
}

export default function ReminderKpiStats({ reminders, availableChannels }: ReminderKpiStatsProps) {
  const activeCount = reminders.filter((r) => r.is_active).length;
  const totalDispatches = reminders.reduce((acc, r) => acc + (r.run_count || 0), 0);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
      {/* Total Reminders Card */}
      <div
        style={{
          background: "#ffffff",
          padding: "18px 20px",
          borderRadius: "8px",
          border: "1px solid #e1dfdd",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "8px",
            background: "#efe5ef",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#742774",
          }}
        >
          <Clock style={{ width: "22px", height: "22px" }} />
        </div>
        <div>
          <div style={{ fontSize: "12px", color: "#605e5c", fontWeight: "600" }}>Total Reminders</div>
          <div style={{ fontSize: "20px", fontWeight: "700", color: "#323130", marginTop: "2px" }}>
            {reminders.length}
          </div>
        </div>
      </div>

      {/* Active Schedules Card */}
      <div
        style={{
          background: "#ffffff",
          padding: "18px 20px",
          borderRadius: "8px",
          border: "1px solid #e1dfdd",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "8px",
            background: "#f0fdf4",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#16a34a",
          }}
        >
          <CheckCircle2 style={{ width: "22px", height: "22px" }} />
        </div>
        <div>
          <div style={{ fontSize: "12px", color: "#605e5c", fontWeight: "600" }}>Active Schedules</div>
          <div style={{ fontSize: "20px", fontWeight: "700", color: "#16a34a", marginTop: "2px" }}>
            {activeCount}
          </div>
        </div>
      </div>

      {/* Channel Coverage Card */}
      <div
        style={{
          background: "#ffffff",
          padding: "18px 20px",
          borderRadius: "8px",
          border: "1px solid #e1dfdd",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "8px",
            background: "#eff6ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#2563eb",
          }}
        >
          <Send style={{ width: "22px", height: "22px" }} />
        </div>
        <div>
          <div style={{ fontSize: "12px", color: "#605e5c", fontWeight: "600" }}>Channels Connected</div>
          <div style={{ fontSize: "20px", fontWeight: "700", color: "#2563eb", marginTop: "2px" }}>
            {availableChannels.length}
          </div>
        </div>
      </div>

      {/* Total Dispatched Runs Card */}
      <div
        style={{
          background: "#ffffff",
          padding: "18px 20px",
          borderRadius: "8px",
          border: "1px solid #e1dfdd",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "8px",
            background: "#fef3c7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#d97706",
          }}
        >
          <Bell style={{ width: "22px", height: "22px" }} />
        </div>
        <div>
          <div style={{ fontSize: "12px", color: "#605e5c", fontWeight: "600" }}>Total Dispatches</div>
          <div style={{ fontSize: "20px", fontWeight: "700", color: "#323130", marginTop: "2px" }}>
            {totalDispatches}
          </div>
        </div>
      </div>
    </div>
  );
}
