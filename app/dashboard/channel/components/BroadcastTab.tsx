"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Send } from "lucide-react";
import { ChannelItem } from "../types";

interface BroadcastTabProps {
  selectedChannel: ChannelItem;
  broadcastRecipients: string;
  setBroadcastRecipients: (rec: string) => void;
  broadcastMessage: string;
  setBroadcastMessage: (msg: string) => void;
  broadcastSending: boolean;
  broadcastResult: string | null;
  isWaConnected: boolean;
  onSendBroadcast: (e: React.FormEvent) => Promise<void>;
}

export default function BroadcastTab({
  selectedChannel,
  broadcastRecipients,
  setBroadcastRecipients,
  broadcastMessage,
  setBroadcastMessage,
  broadcastSending,
  broadcastResult,
  isWaConnected,
  onSendBroadcast,
}: BroadcastTabProps) {
  return (
    <div
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
      <h2
        style={{
          fontSize: "18px",
          fontWeight: "bold",
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          margin: 0,
          color: "var(--foreground)",
        }}
      >
        Broadcast Message Sender
      </h2>
      <p style={{ fontSize: "13px", color: "var(--muted-foreground)", margin: 0 }}>
        Broadcast announcement messages to multiple customer phone numbers simultaneously via {selectedChannel.name}.
      </p>

      {broadcastResult && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "8px",
            background: "#f0fdf4",
            border: "1px solid #86efac",
            color: "#166534",
            fontSize: "13px",
          }}
        >
          {broadcastResult}
        </div>
      )}

      <form onSubmit={onSendBroadcast} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <div>
          <label style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
            Recipients List (Comma or newline separated) *
          </label>
          <Textarea
            required
            rows={3}
            placeholder="+628123456789, +628987654321..."
            value={broadcastRecipients}
            onChange={(e) => setBroadcastRecipients(e.target.value)}
            style={{ fontFamily: "var(--font-mono)" }}
          />
        </div>

        <div>
          <label style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
            Broadcast Message Text *
          </label>
          <Textarea
            required
            rows={4}
            placeholder="Enter broadcast text content to deliver..."
            value={broadcastMessage}
            onChange={(e) => setBroadcastMessage(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={broadcastSending || !isWaConnected}
            style={isWaConnected ? { background: "#25D366" } : undefined}
          >
            <Send style={{ width: "16px", height: "16px" }} />
            <span>
              {broadcastSending
                ? "Sending Broadcast..."
                : isWaConnected
                ? "Send Broadcast Message"
                : "Connect WhatsApp First"}
            </span>
          </Button>
        </div>
      </form>
    </div>
  );
}
