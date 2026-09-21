"use client";

import React, { useState } from "react";
import { Info } from "lucide-react";

export interface FeatureBadgeTooltipProps {
  icon?: React.ReactNode;
  badgeLabel?: string;
  title: string;
  modelName?: string;
  description: string;
  details?: (string | null | undefined)[];
  color?: string;
}

export function FeatureBadgeTooltip({
  icon,
  badgeLabel,
  title,
  modelName,
  description,
  details = [],
  color = "var(--primary)"
}: FeatureBadgeTooltipProps) {
  const [hovered, setHovered] = useState(false);
  const activeDetails = details.filter(Boolean) as string[];

  return (
    <span
      style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span
        style={{
          background: "var(--muted)",
          borderRadius: "6px",
          padding: icon && !badgeLabel ? "4px 7px" : "3px 8px",
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          cursor: "pointer",
          transition: "all 0.15s ease",
          boxShadow: hovered ? `0 0 0 1.5px ${color}` : "none",
          border: hovered ? `1px solid ${color}` : "1px solid var(--border)"
        }}
      >
        {icon}
        {badgeLabel && (
          <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--foreground)" }}>
            {badgeLabel}
          </span>
        )}
      </span>

      {hovered && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--popover)",
            color: "var(--popover-foreground)",
            fontSize: "11.5px",
            fontWeight: "500",
            padding: "10px 14px",
            borderRadius: "10px",
            whiteSpace: "nowrap",
            boxShadow: "var(--shadow-md), 0 6px 20px rgba(0, 0, 0, 0.08)",
            border: "1px solid var(--border)",
            zIndex: 10000,
            pointerEvents: "none",
            display: "flex",
            flexDirection: "column",
            gap: "5px",
            textAlign: "left",
            minWidth: "200px",
            maxWidth: "300px"
          }}
        >
          {/* TOOLTIP HEADER */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", borderBottom: "1px solid var(--border)", paddingBottom: "6px" }}>
            {icon && <span style={{ display: "inline-flex" }}>{icon}</span>}
            <span style={{ fontWeight: "700", color: "var(--foreground)", fontSize: "12px", letterSpacing: "0.01em" }}>
              {title}
            </span>
          </div>

          {/* MODEL NAME IF RESOLVED */}
          {modelName && (
            <div style={{ fontSize: "11px", fontWeight: "600", color: "var(--primary)" }}>
              {modelName}
            </div>
          )}

          {/* MAIN DESCRIPTION */}
          <span style={{ color: "var(--muted-foreground)", fontSize: "11px", lineHeight: "1.4", whiteSpace: "normal" }}>
            {description}
          </span>

          {/* SPEC DETAILS / BULLETS */}
          {activeDetails.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "2px", paddingTop: "6px", borderTop: "1px solid var(--border)" }}>
              {activeDetails.map((det, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "6px", fontSize: "10.5px", color: "var(--foreground)" }}>
                  <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: color, display: "inline-block", marginTop: "4px", flexShrink: 0 }} />
                  <span style={{ lineHeight: "1.35", color: "var(--muted-foreground)" }}>{det}</span>
                </div>
              ))}
            </div>
          )}

          {/* ARROW BORDER */}
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "6px solid var(--border)"
            }}
          />
          {/* ARROW FILL */}
          <div
            style={{
              position: "absolute",
              top: "calc(100% - 1px)",
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: "5px solid var(--popover)"
            }}
          />
        </div>
      )}
    </span>
  );
}

export interface InfoTooltipProps {
  title: string;
  description: string;
  color?: string;
}

export function InfoTooltip({
  title,
  description,
  color = "var(--primary)"
}: InfoTooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <span
      style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={(e) => {
        e.stopPropagation();
        setOpen((prev) => !prev);
      }}
    >
      <span
        style={{
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2px",
          borderRadius: "50%",
          color: open ? color : "var(--muted-foreground)",
          transition: "color 0.15s ease"
        }}
      >
        <Info style={{ width: "13px", height: "13px" }} />
      </span>

      {open && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--popover)",
            color: "var(--popover-foreground)",
            fontSize: "11px",
            fontWeight: "500",
            padding: "9px 12px",
            borderRadius: "8px",
            boxShadow: "var(--shadow-md), 0 6px 20px rgba(0,0,0,0.08)",
            border: "1px solid var(--border)",
            zIndex: 1000000,
            width: "220px",
            boxSizing: "border-box",
            lineHeight: "1.4",
            pointerEvents: "none"
          }}
        >
          <div style={{ fontWeight: "700", color: "var(--foreground)", marginBottom: "4px", fontSize: "11.5px" }}>
            {title}
          </div>
          <div style={{ color: "var(--muted-foreground)" }}>{description}</div>
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "6px solid var(--border)"
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "calc(100% - 1px)",
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: "5px solid var(--popover)"
            }}
          />
        </div>
      )}
    </span>
  );
}
