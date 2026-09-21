"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { X } from "lucide-react";

export interface RecipientBadgeItemProps {
  idx: number;
  title: string;
  subtitle: string | null;
  bg: string;
  color?: string;
  subtitleColor?: string;
  boxShadow?: string;
  onSelect: () => void;
  onRemove: () => void;
}

export default function RecipientBadgeItem({
  title,
  subtitle,
  bg,
  color = "#ffffff",
  subtitleColor = "rgba(255,255,255,0.85)",
  boxShadow = "0 1px 2px rgba(0,0,0,0.08)",
  onSelect,
  onRemove,
}: RecipientBadgeItemProps) {
  return (
    <div
      onClick={onSelect}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "10px",
        padding: subtitle ? "6px 12px" : "6px 14px",
        borderRadius: "6px",
        background: bg,
        color,
        cursor: "pointer",
        boxShadow,
      }}
      title="Click to edit"
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: "1.25" }}>
        <span style={{ fontSize: "12.5px", fontWeight: "700", color }}>
          {title}
        </span>
        {subtitle && (
          <span style={{ fontSize: "10px", color: subtitleColor, fontFamily: "var(--font-mono)", opacity: 0.9, marginTop: "2px" }}>
            {subtitle}
          </span>
        )}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        style={{
          background: "rgba(255, 255, 255, 0.25)",
          border: "none",
          borderRadius: "50%",
          width: "16px",
          height: "16px",
          padding: 0,
          minWidth: "auto",
        }}
        title="Remove"
      >
        <X style={{ width: "10px", height: "10px", color }} />
      </Button>
    </div>
  );
}
