"use client";

import React from "react";
import { MessageSquare, Bot } from "lucide-react";
import { formatDateCustom } from "@/lib/utils/formatters";
import { ChannelItem, WhatsAppStatus } from "../types";

interface ChannelOverviewTabProps {
  selectedChannel: ChannelItem;
  isWa: boolean;
  isChannelConnected: boolean;
  statusText: string;
  waStatus: WhatsAppStatus | null;
  isWaQR: boolean;
  isWaConnecting: boolean;
}

export default function ChannelOverviewTab({
  selectedChannel,
  isWa,
  isChannelConnected,
  statusText,
  waStatus,
  isWaQR,
  isWaConnecting,
}: ChannelOverviewTabProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
      {/* Left Card: Basic Information */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e1dfdd",
          borderRadius: "8px",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <h2 style={{ fontSize: "16px", fontWeight: "700", margin: 0, color: "#323130" }}>
          Basic Information
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "13px" }}>
          <div>
            <div style={{ fontSize: "12px", color: "#605e5c", fontWeight: 600 }}>Name</div>
            <div style={{ fontWeight: 700, fontSize: "15px", color: "#323130", marginTop: "2px" }}>
              {selectedChannel.name}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "12px", color: "#605e5c", fontWeight: 600 }}>Description</div>
            <div style={{ color: "#323130", marginTop: "2px" }}>
              {selectedChannel.description || "No description provided"}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "12px", color: "#605e5c", fontWeight: 600 }}>Channel Type</div>
            <div style={{ fontWeight: 600, color: "#323130", marginTop: "2px" }}>
              {isWa ? "WhatsApp" : "Telegram"}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "12px", color: "#605e5c", fontWeight: 600 }}>Status</div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: isWa
                    ? isChannelConnected
                      ? "#107c41"
                      : isWaQR || isWaConnecting
                      ? "#d97706"
                      : "#605e5c"
                    : "#0078d4",
                }}
              />
              <span style={{ fontWeight: 700, color: isChannelConnected ? "#107c41" : "#323130" }}>
                {statusText}
              </span>
            </div>
          </div>

          {isWa && isChannelConnected && waStatus?.userInfo?.phone && (
            <div>
              <div style={{ fontSize: "12px", color: "#605e5c", fontWeight: 600 }}>Connected Phone</div>
              <div style={{ fontWeight: 700, color: "#107c41", marginTop: "2px" }}>
                {waStatus?.userInfo?.phone || "Linked Device"}
              </div>
            </div>
          )}

          <div>
            <div style={{ fontSize: "12px", color: "#605e5c", fontWeight: 600 }}>Created At</div>
            <div style={{ color: "#323130", marginTop: "2px" }}>
              {formatDateCustom(selectedChannel.createdAt)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "12px", color: "#605e5c", fontWeight: 600 }}>Updated At</div>
            <div style={{ color: "#323130", marginTop: "2px" }}>
              {formatDateCustom(selectedChannel.updatedAt)}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Statistics & Engine */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e1dfdd",
            borderRadius: "8px",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <h2 style={{ fontSize: "16px", fontWeight: "700", margin: 0, color: "#323130" }}>
            Statistics
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div
              style={{
                background: "#faf9f8",
                borderRadius: "6px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
                border: "1px solid #f3f2f1",
              }}
            >
              <MessageSquare style={{ width: "24px", height: "24px", color: "#742774" }} />
              <span style={{ fontSize: "24px", fontWeight: "700", color: "#323130" }}>
                {isChannelConnected ? "1" : "0"}
              </span>
              <span style={{ fontSize: "12px", color: "#605e5c" }}>Messages</span>
            </div>

            <div
              style={{
                background: "#faf9f8",
                borderRadius: "6px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
                border: "1px solid #f3f2f1",
              }}
            >
              <Bot style={{ width: "24px", height: "24px", color: "#742774" }} />
              <span style={{ fontSize: "24px", fontWeight: "700", color: "#323130" }}>
                {isChannelConnected ? "1" : "0"}
              </span>
              <span style={{ fontSize: "12px", color: "#605e5c" }}>Auto-Replies</span>
            </div>
          </div>
        </div>

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e1dfdd",
            borderRadius: "8px",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <h2 style={{ fontSize: "16px", fontWeight: "700", margin: 0, color: "#323130" }}>
            Engine Configuration
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
            <div>
              <div style={{ fontSize: "12px", color: "#605e5c", fontWeight: 600 }}>Channel Engine</div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#f3f2f1",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  marginTop: "4px",
                  color: "#323130",
                }}
              >
                {isWa ? "baileys" : "Grammy"}
              </div>
            </div>

            <div>
              <div style={{ fontSize: "12px", color: "#605e5c", fontWeight: 600 }}>AI Auto-Reply Bot</div>
              <div style={{ marginTop: "4px" }}>
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: "12px",
                    fontSize: "11px",
                    fontWeight: 700,
                    background: selectedChannel.autoReplyEnabled ? "#efe5ef" : "#f3f2f1",
                    color: selectedChannel.autoReplyEnabled ? "#742774" : "#605e5c",
                  }}
                >
                  {selectedChannel.autoReplyEnabled ? "ENABLED" : "DISABLED"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
