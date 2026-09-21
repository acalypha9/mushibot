"use client";

import React from "react";
import Portal from "@/components/ui/Portal";
import Button from "@/components/ui/Button";
import { MessageBubble, Message } from "@/components/chat/message-bubble";
import { X, AlertCircle, FileText } from "lucide-react";

interface MessageLogDrawerProps {
  isOpen: boolean;
  selectedConvId: string | null;
  messages: Message[];
  loading: boolean;
  error: string | null;
  onClose: () => void;
}

export function MessageLogDrawer({
  isOpen,
  selectedConvId,
  messages,
  loading,
  error,
  onClose
}: MessageLogDrawerProps) {
  return (
    <Portal>
      {/* High-Performance Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(15, 23, 42, 0.45)",
          zIndex: 99998,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          visibility: isOpen ? "visible" : "hidden",
          transition: "opacity 0.25s ease, visibility 0.25s ease"
        }}
      />

      {/* Pure Hardware-Accelerated Sliding Message Log Drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "600px",
          maxWidth: "100vw",
          background: "#ffffff",
          boxShadow: isOpen ? "-8px 0 25px rgba(0,0,0,0.15)" : "none",
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          transform: isOpen ? "translate3d(0, 0, 0)" : "translate3d(100%, 0, 0)",
          pointerEvents: isOpen ? "auto" : "none",
          visibility: isOpen ? "visible" : "hidden",
          transition: "transform 0.25s cubic-bezier(0.2, 0, 0, 1), visibility 0.25s cubic-bezier(0.2, 0, 0, 1)",
          willChange: "transform"
        }}
      >
        {/* PANEL HEADER */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #e2e8f0",
            background: "#f8fafc",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h3
              style={{
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                fontSize: "14px",
                fontWeight: "bold",
                color: "#0f172a",
                margin: 0,
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}
            >
              MESSAGE LOG
            </h3>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            {selectedConvId && (
              <span style={{ fontSize: "12px", color: "#64748b", fontFamily: "var(--font-mono)", fontWeight: "600" }}>
                ID: {selectedConvId}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              style={{ padding: "4px", color: "#64748b" }}
            >
              <X style={{ width: "20px", height: "20px" }} />
            </Button>
          </div>
        </div>

        {/* MESSAGES VIEWPORT */}
        <div
          style={{
            flexGrow: 1,
            overflowY: "auto",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            background: "#fdfdfd"
          }}
        >
          {error && (
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
              <AlertCircle style={{ width: "16px", height: "16px" }} /> {error}
            </div>
          )}

          {!selectedConvId && !error && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "#94a3b8",
                fontSize: "13.5px",
                gap: "10px"
              }}
            >
              <FileText style={{ width: "36px", height: "36px", color: "#cbd5e1" }} />
              Select a conversation session to review logs.
            </div>
          )}

          {loading && (
            <div style={{ padding: "32px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
              Loading message logs...
            </div>
          )}

          {!loading && messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
        </div>
      </div>
    </Portal>
  );
}
