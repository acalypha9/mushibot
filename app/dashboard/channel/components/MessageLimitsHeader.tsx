"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { Save } from "lucide-react";

export interface MessageLimitsHeaderProps {
  hasUnsavedMessageChanges: boolean;
  isSaved: boolean;
}

export default function MessageLimitsHeader({
  hasUnsavedMessageChanges,
  isSaved,
}: MessageLimitsHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid var(--border)",
        paddingBottom: "16px",
        marginBottom: "4px",
        minHeight: "42px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
        <h2
          style={{
            fontSize: "18px",
            fontWeight: "bold",
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            margin: 0,
            color: "var(--foreground)",
          }}
        >
          Message Rate Limits & Access Control
        </h2>
        {hasUnsavedMessageChanges ? (
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
        ) : isSaved ? (
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
        variant={hasUnsavedMessageChanges ? "primary" : "ghost"}
        size="md"
      >
        <Save
          style={{
            width: "15px",
            height: "15px",
            color: hasUnsavedMessageChanges ? "#ffffff" : "var(--primary)",
          }}
        />
        <span>Save Configuration</span>
      </Button>
    </div>
  );
}
