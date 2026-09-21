"use client";

import React, { useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { chatMessageSchema, ChatMessageFormValues } from "../../lib/schemas/chat";
import { ArrowUp, Square } from "lucide-react";

export interface ChatInputBarProps {
  streaming: boolean;
  isResolved: boolean;
  hasProviderWarning: boolean;
  onSendMessage: (content: string) => void;
  onStopStreaming: () => void;
}

export function ChatInputBar({
  streaming,
  isResolved,
  hasProviderWarning,
  onSendMessage,
  onStopStreaming,
}: ChatInputBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const {
    register,
    handleSubmit,
    reset,
  } = useForm<ChatMessageFormValues>({
    resolver: zodResolver(chatMessageSchema),
  });

  const { ref: registerRef, onChange: registerOnChange, ...contentRegistration } = register("content");

  const adjustTextareaHeight = (el: HTMLTextAreaElement | null) => {
    if (el) {
      if (!el.value || el.value.trim() === "") {
        el.style.height = "42px";
        return;
      }
      el.style.height = "auto";
      const scrollH = el.scrollHeight;
      el.style.height = `${Math.min(Math.max(scrollH, 42), 220)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(onSubmit)();
    }
  };

  const onSubmit = (values: ChatMessageFormValues) => {
    onSendMessage(values.content);
    reset({ content: "" });
    if (textareaRef.current) {
      textareaRef.current.style.height = "42px";
    }
  };

  const onSubmitRef = useRef(onSubmit);
  useEffect(() => {
    onSubmitRef.current = onSubmit;
  });

  const isDisabled = streaming || isResolved || hasProviderWarning;

  return (
    <form
      onSubmit={(e) => {
        handleSubmit((values) => onSubmitRef.current(values))(e);
      }}
      style={{
        padding: "12px 16px",
        borderTop: "1px solid var(--border)",
        background: "var(--muted)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          display: "flex",
          alignItems: "center",
        }}
      >
        <textarea
          {...contentRegistration}
          ref={(e) => {
            registerRef(e);
            textareaRef.current = e;
          }}
          disabled={isDisabled}
          rows={1}
          onKeyDown={handleKeyDown}
          onInput={(e) => adjustTextareaHeight(e.currentTarget)}
          onChange={(e) => {
            registerOnChange(e);
            adjustTextareaHeight(e.currentTarget);
          }}
          placeholder={
            hasProviderWarning
              ? "Chat disabled: Please check provider configuration."
              : isResolved
              ? "This support session has been marked as resolved."
              : "Type your message..."
          }
          style={{
            width: "100%",
            height: "42px",
            minHeight: "42px",
            maxHeight: "220px",
            padding: "10px 46px 10px 14px",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            background: isDisabled ? "var(--border)" : "var(--card)",
            color: isDisabled ? "var(--muted-foreground)" : "var(--foreground)",
            cursor: isDisabled ? "not-allowed" : "text",
            fontFamily: "var(--font-body)",
            fontSize: "14px",
            lineHeight: "1.4",
            resize: "none",
            outline: "none",
            boxSizing: "border-box",
            overflowY: "auto",
            transition: "border-color 0.15s ease",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#742774";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
          }}
        />

        {streaming ? (
          <button
            type="button"
            onClick={onStopStreaming}
            style={{
              position: "absolute",
              right: "6px",
              bottom: "5px",
              width: "32px",
              height: "32px",
              background: "var(--primary)",
              color: "#ffffff",
              border: "none",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              boxShadow: "var(--shadow-sm)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s ease",
            }}
            title="Stop generating"
          >
            <Square style={{ width: "12px", height: "12px", fill: "currentColor" }} />
          </button>
        ) : (
          <button
            type="submit"
            disabled={isResolved || hasProviderWarning}
            style={{
              position: "absolute",
              right: "6px",
              bottom: "5px",
              width: "32px",
              height: "32px",
              background:
                isResolved || hasProviderWarning
                  ? "var(--border)"
                  : "var(--primary)",
              color:
                isResolved || hasProviderWarning
                  ? "var(--muted-foreground)"
                  : "#ffffff",
              border: "none",
              borderRadius: "var(--radius-sm)",
              cursor:
                isResolved || hasProviderWarning ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow:
                isResolved || hasProviderWarning
                  ? "none"
                  : "var(--shadow-sm)",
              transition: "all 0.15s ease",
            }}
            title="Send message (Enter)"
          >
            <ArrowUp style={{ width: "16px", height: "16px" }} />
          </button>
        )}
      </div>
    </form>
  );
}
