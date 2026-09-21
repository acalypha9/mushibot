"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { Save, Loader2 } from "lucide-react";

export interface ProviderHeaderRowProps {
  providerName: string;
  hasUnsavedChanges: boolean;
  isSaved: boolean;
  saving: boolean;
  baseUrl: string;
  onSave: (e?: React.FormEvent) => void;
}

export function ProviderHeaderRow({
  providerName,
  hasUnsavedChanges,
  isSaved,
  saving,
  baseUrl,
  onSave
}: ProviderHeaderRowProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        borderBottom: "1px solid var(--border)",
        paddingBottom: "16px"
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <h1
            style={{
              fontSize: "20px",
              fontWeight: "700",
              color: "var(--foreground)",
              margin: 0
            }}
          >
            {providerName}
          </h1>
          {hasUnsavedChanges ? (
            <span
              style={{
                padding: "3px 10px",
                borderRadius: "12px",
                background: "rgba(217, 119, 6, 0.12)",
                color: "#d97706",
                border: "1px solid rgba(217, 119, 6, 0.3)",
                fontSize: "12px",
                fontWeight: "600",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#d97706"
                }}
              />
              Unsaved changes
            </span>
          ) : isSaved ? (
            <span
              style={{
                padding: "3px 10px",
                borderRadius: "12px",
                background: "rgba(22, 163, 74, 0.12)",
                color: "#16a34a",
                border: "1px solid rgba(22, 163, 74, 0.3)",
                fontSize: "12px",
                fontWeight: "600",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#16a34a"
                }}
              />
              Saved
            </span>
          ) : null}
        </div>
        <div style={{ fontSize: "12px", color: "var(--muted-foreground)", marginTop: "4px" }}>
          {baseUrl}
        </div>
      </div>

      <Button
        type="button"
        variant={hasUnsavedChanges ? "primary" : "outline"}
        size="md"
        onClick={() => onSave()}
        disabled={saving}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px"
        }}
      >
        {saving ? (
          <>
            <Loader2
              style={{ width: "15px", height: "15px", animation: "spin 1s linear infinite" }}
            />{" "}
            Saving...
          </>
        ) : (
          <>
            <Save style={{ width: "15px", height: "15px" }} /> Save Configuration
          </>
        )}
      </Button>
    </div>
  );
}
