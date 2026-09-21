"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { McpToolItem } from "../types";
import { Wrench, Code, ChevronUp, ChevronDown } from "lucide-react";

interface ViewMcpToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  serverName: string;
  tools: (string | McpToolItem)[];
}

export default function ViewMcpToolsModal({
  isOpen,
  onClose,
  serverName,
  tools,
}: ViewMcpToolsModalProps) {
  const [expandedToolIndex, setExpandedToolIndex] = useState<number | null>(null);

  const toggleExpanded = (idx: number) => {
    setExpandedToolIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Available Tools (${tools.length})`}
      subtitle={`Tools exported by ${serverName} MCP server.`}
      icon={<Wrench style={{ width: "20px", height: "20px", color: "var(--primary)" }} />}
      maxWidth="md"
      footer={
        <Button type="button" variant="primary" size="md" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div
        style={{
          maxHeight: "360px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          paddingRight: "4px",
        }}
      >
        {tools.map((toolItem, idx) => {
          const toolName = typeof toolItem === "string" ? toolItem : toolItem.name;
          const toolDesc = typeof toolItem === "string" ? null : toolItem.description;
          const isExpanded = expandedToolIndex === idx;

          return (
            <div
              key={toolName || idx}
              onClick={() => toggleExpanded(idx)}
              style={{
                padding: "12px 14px",
                borderRadius: "var(--radius-md, 8px)",
                background: "var(--background)",
                border: isExpanded ? "1px solid var(--primary)" : "1px solid var(--border)",
                cursor: "pointer",
                transition: "all 0.15s ease",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Code style={{ width: "14px", height: "14px", color: "var(--primary)", flexShrink: 0 }} />
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: "700",
                      fontFamily: "var(--font-mono)",
                      color: "var(--foreground)",
                    }}
                  >
                    {toolName}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    color: "var(--muted-foreground)",
                    fontSize: "11px",
                    fontWeight: "600",
                  }}
                >
                  <span>{isExpanded ? "Hide details" : "View details"}</span>
                  {isExpanded ? (
                    <ChevronUp style={{ width: "14px", height: "14px" }} />
                  ) : (
                    <ChevronDown style={{ width: "14px", height: "14px" }} />
                  )}
                </div>
              </div>

              {/* Tool Description */}
              {isExpanded && (
                <div
                  style={{
                    marginTop: "4px",
                    padding: "10px 12px",
                    borderRadius: "var(--radius-sm, 4px)",
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    fontSize: "12px",
                    color: "var(--foreground)",
                    lineHeight: "1.5",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {toolDesc || "No description provided for this tool."}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
