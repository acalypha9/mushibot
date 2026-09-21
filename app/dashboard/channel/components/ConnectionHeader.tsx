"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { Save, RotateCcw, CheckCircle2 } from "lucide-react";

export interface ConnectionHeaderProps {
  hasUnsavedConnectionChanges: boolean;
  isSaved: boolean;
  resetSuccessMsg: string | null;
  resettingConversations: boolean;
  onOpenResetConfirm: () => void;
}

export const ConnectionHeader: React.FC<ConnectionHeaderProps> = ({
  hasUnsavedConnectionChanges,
  isSaved,
  resetSuccessMsg,
  resettingConversations,
  onOpenResetConfirm,
}) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid #e1dfdd",
        paddingBottom: "16px",
        marginBottom: "4px",
        minHeight: "42px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "bold", margin: 0, color: "#323130" }}>
          Channel Pairing Settings
        </h2>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onOpenResetConfirm();
          }}
          disabled={resettingConversations}
          title="Reset and clear all chat history for this channel"
        >
          <RotateCcw
            style={{
              width: "13px",
              height: "13px",
              color: "#e11d48",
              animation: resettingConversations ? "spin 1s linear infinite" : "none",
            }}
          />
          <span>{resettingConversations ? "Resetting..." : "Reset All Conversations"}</span>
        </Button>

        {resetSuccessMsg && (
          <span
            style={{
              padding: "3px 10px",
              borderRadius: "12px",
              background: "#dcfce7",
              color: "#15803d",
              border: "1px solid #bbf7d0",
              fontSize: "12px",
              fontWeight: "600",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <CheckCircle2 style={{ width: "13px", height: "13px", color: "#16a34a" }} />
            <span>{resetSuccessMsg}</span>
          </span>
        )}

        {hasUnsavedConnectionChanges ? (
          <span
            style={{
              padding: "3px 10px",
              borderRadius: "12px",
              background: "#fef3c7",
              color: "#b45309",
              border: "1px solid #fde68a",
              fontSize: "12px",
              fontWeight: "600",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#d97706" }} />
            Unsaved changes
          </span>
        ) : isSaved && !resetSuccessMsg ? (
          <span
            style={{
              padding: "3px 10px",
              borderRadius: "12px",
              background: "#dcfce7",
              color: "#15803d",
              border: "1px solid #bbf7d0",
              fontSize: "12px",
              fontWeight: "600",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#16a34a" }} />
            Saved
          </span>
        ) : null}
      </div>

      <Button
        type="submit"
        variant={hasUnsavedConnectionChanges ? "primary" : "ghost"}
        size="md"
      >
        <Save
          style={{
            width: "15px",
            height: "15px",
            color: hasUnsavedConnectionChanges ? "#ffffff" : "var(--primary)",
          }}
        />
        <span>Save Configuration</span>
      </Button>
    </div>
  );
};
