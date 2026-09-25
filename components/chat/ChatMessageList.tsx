"use client";

import React, { RefObject } from "react";
import { MessageBubble, Message } from "./message-bubble";
import { Sparkles, AlertTriangle, X } from "lucide-react";

export interface ChatMessageListProps {
  messages: Message[];
  streaming: boolean;
  onEditMessage?: (messageId: string, content: string) => void;
  providerWarning?: string | null;
  error?: string | null;
  onDismissError?: () => void;
  endRef: RefObject<HTMLDivElement | null>;
}

export function ChatMessageList({
  messages,
  streaming,
  onEditMessage,
  providerWarning,
  error,
  onDismissError,
  endRef,
}: ChatMessageListProps) {
  let lastCustomerMsgId: string | undefined = undefined;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].sender_type === "CUSTOMER") {
      lastCustomerMsgId = messages[i].id;
      break;
    }
  }

  return (
    <>
      <div
        style={{
          flexGrow: 1,
          minWidth: 0,
          width: "100%",
          overflowY: "auto",
          padding: "var(--space-4)",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {messages.map((m, idx) => (
          <MessageBubble
            key={m.clientId || m.id || idx}
            message={m}
            onEdit={
              !streaming && m.id === lastCustomerMsgId && onEditMessage
                ? onEditMessage
                : undefined
            }
          />
        ))}

        {messages.length === 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              margin: "auto",
              gap: "8px",
              maxWidth: "20rem",
              textAlign: "center",
            }}
          >
            <Sparkles
              style={{ width: "32px", height: "32px", color: "var(--primary)" }}
            />
            <p style={{ fontWeight: 600, fontSize: "14px" }}>
              New support request
            </p>
            <p
              style={{
                fontSize: "12px",
                color: "var(--muted-foreground)",
                lineHeight: "1.4",
              }}
            >
              Introduce yourself or explain the issue, and our assistants will get
              back to you immediately!
            </p>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {(providerWarning || error) && (
        <div
          style={{
            color: "#c2410c",
            borderTop: "1px solid #fdba74",
            padding: "10px 16px",
            background: "#fff7ed",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
            fontWeight: "500",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertTriangle
              style={{ width: "16px", height: "16px", flexShrink: 0 }}
            />
            <span>{providerWarning || error}</span>
          </div>
          {error && !providerWarning && onDismissError && (
            <button
              type="button"
              onClick={onDismissError}
              style={{
                background: "transparent",
                border: "none",
                color: "#c2410c",
                cursor: "pointer",
                padding: "2px",
                display: "flex",
                alignItems: "center",
              }}
              title="Dismiss error"
            >
              <X style={{ width: "15px", height: "15px" }} />
            </button>
          )}
        </div>
      )}
    </>
  );
}
