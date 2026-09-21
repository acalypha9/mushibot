"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { FunctionToolItem } from "../types";
import { formatSchemaJson } from "../utils";
import { Code, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";

interface ToolSchemaDropdownProps {
  tool: FunctionToolItem;
  isOpen: boolean;
  onToggle: (e?: React.MouseEvent) => void;
  isCopied: boolean;
  onCopy: (tool: FunctionToolItem, e?: React.MouseEvent) => void;
}

export default function ToolSchemaDropdown({
  tool,
  isOpen,
  onToggle,
  isCopied,
  onCopy,
}: ToolSchemaDropdownProps) {
  return (
    <div>
      <Button
        type="button"
        variant="ghost"
        onClick={onToggle}
        style={{
          border: "1px solid var(--border)",
          borderRadius: isOpen ? "6px 6px 0 0" : "6px",
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          fontSize: "12px",
          fontWeight: "700",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Code style={{ width: "14px", height: "14px", color: "var(--secondary)" }} />
          <span
            style={{
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              fontSize: "11px",
              color: "var(--muted-foreground)",
            }}
          >
            Parameters Schema
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {isOpen && (
            <span
              onClick={(e) => onCopy(tool, e)}
              style={{
                color: "var(--secondary)",
                fontSize: "11px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "2px 6px",
                borderRadius: "4px",
                background: "var(--muted)",
              }}
              title="Copy Schema"
            >
              {isCopied ? (
                <Check style={{ width: "12px", height: "12px", color: "var(--primary)" }} />
              ) : (
                <Copy style={{ width: "12px", height: "12px" }} />
              )}
              <span>{isCopied ? "Copied!" : "Copy Schema"}</span>
            </span>
          )}
          {isOpen ? (
            <ChevronUp style={{ width: "14px", height: "14px", color: "var(--muted-foreground)" }} />
          ) : (
            <ChevronDown style={{ width: "14px", height: "14px", color: "var(--muted-foreground)" }} />
          )}
        </div>
      </Button>

      {isOpen && (
        <pre
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderTop: "none",
            borderRadius: "0 0 6px 6px",
            padding: "10px 14px",
            fontSize: "12px",
            fontFamily: "var(--font-mono)",
            color: "var(--foreground)",
            overflowX: "auto",
            margin: 0,
            lineHeight: "1.4",
          }}
        >
          {formatSchemaJson(tool.parameters_json)}
        </pre>
      )}
    </div>
  );
}
