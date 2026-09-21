"use client";

import React from "react";
import { MessageBubble, Message } from "@/components/chat/message-bubble";
import { MessageSquare, AlertCircle, FileText } from "lucide-react";
import { Conversation } from "./types";
import { getConversationTitleDisplay } from "./helpers";

interface SplitConversationViewProps {
  conversations: Conversation[];
  filteredCount: number;
  selectedConvId: string | null;
  onSelectConversation: (id: string) => void;
  messages: Message[];
  msgLoading: boolean;
  msgError: string | null;
}

export function SplitConversationView({
  conversations,
  filteredCount,
  selectedConvId,
  onSelectConversation,
  messages,
  msgLoading,
  msgError
}: SplitConversationViewProps) {
  return (
    <div style={{ display: "flex", gap: "20px", height: "calc(100vh - 220px)", minHeight: "550px" }}>
      {/* LEFT LIST PANEL */}
      <div
        style={{
          width: "320px",
          flexShrink: 0,
          background: "#ffffff",
          border: "1px solid #e1dfdd",
          borderRadius: "12px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
        }}
      >
        {/* SESSION LIST HEADER */}
        <div
          style={{
            padding: "14px 16px",
            borderBottom: "1px solid #e1dfdd",
            background: "#faf9f8",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <span style={{ fontSize: "12px", fontWeight: "700", color: "#323130", display: "flex", alignItems: "center", gap: "6px" }}>
            <MessageSquare style={{ width: "15px", height: "15px", color: "#742774" }} /> Session List
          </span>
          <span style={{ background: "#efe5ef", color: "#742774", fontSize: "11px", fontWeight: "700", padding: "1px 7px", borderRadius: "10px" }}>
            {filteredCount}
          </span>
        </div>

        {/* SCROLLABLE CARDS CONTAINER */}
        <div style={{ flexGrow: 1, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {conversations.map((c) => {
            const isSelected = selectedConvId === c.id;
            const titleText = getConversationTitleDisplay(c);
            const channelCode = (c.channel || "web").toLowerCase() === "web" ? "WHATSAPP" : c.channel.toUpperCase();

            return (
              <div
                key={c.id}
                onClick={() => onSelectConversation(c.id)}
                style={{
                  padding: "12px 14px",
                  borderRadius: "10px",
                  background: isSelected ? "#efe5ef" : "#ffffff",
                  border: isSelected ? "1.5px solid #742774" : "1px solid #f3f2f1",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  transition: "all 0.15s ease",
                  boxShadow: isSelected ? "0 2px 8px rgba(116, 39, 116, 0.12)" : "none"
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = "#faf9f8";
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = "#ffffff";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{ fontSize: "13px", fontWeight: "700", color: "#323130", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    title={titleText}
                  >
                    ID: {c.id.substring(0, 8)} ...
                  </span>
                  <span
                    style={{
                      fontSize: "10px",
                      padding: "2px 7px",
                      borderRadius: "6px",
                      background: c.status === "ACTIVE" || c.status === "OPEN" ? "#dcfce7" : "#efe5ef",
                      color: c.status === "ACTIVE" || c.status === "OPEN" ? "#166534" : "#742774",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      flexShrink: 0
                    }}
                  >
                    {c.status || "OPEN"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11.5px", color: "#605e5c" }}>
                  <span>Channel: {channelCode}</span>
                  <span>{new Date(c.created_at).toLocaleDateString([], { month: "numeric", day: "numeric", year: "2-digit" })}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT MESSAGE LOG PANEL */}
      <div
        style={{
          flexGrow: 1,
          border: "1px solid #e1dfdd",
          background: "#ffffff",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
        }}
      >
        {/* PANEL HEADER */}
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid #e1dfdd",
            background: "#faf9f8",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#323130", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              MESSAGE LOG
            </h3>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            {selectedConvId && (
              <span style={{ fontSize: "12px", color: "#605e5c", fontFamily: "var(--font-mono)", fontWeight: "600" }}>
                ID: {selectedConvId}
              </span>
            )}
          </div>
        </div>

        {/* MESSAGES VIEWPORT */}
        <div
          style={{
            flexGrow: 1,
            overflowY: "auto",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            background: "var(--background, #ffffff)"
          }}
        >
          {msgError && (
            <div
              style={{
                color: "#dc2626",
                border: "1px solid #fca5a5",
                fontSize: "13px",
                background: "#fef2f2",
                padding: "12px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <AlertCircle style={{ width: "16px", height: "16px" }} /> {msgError}
            </div>
          )}

          {!selectedConvId && !msgError && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "#605e5c",
                fontSize: "13.5px",
                gap: "10px"
              }}
            >
              <FileText style={{ width: "36px", height: "36px", color: "#cbd5e1" }} />
              Select a conversation session to review logs.
            </div>
          )}

          {msgLoading && (
            <div style={{ padding: "32px", textAlign: "center", color: "#605e5c", fontSize: "13px" }}>
              Loading message logs...
            </div>
          )}

          {!msgLoading && messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
        </div>
      </div>
    </div>
  );
}
