"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { FunctionToolItem } from "../types";
import { formatSchemaJson } from "../utils";
import { Code, ChevronDown, ChevronUp, Copy, Check, Layers, CornerDownRight } from "lucide-react";

interface DependentToolsSectionProps {
  parentToolId: string;
  dependentTools: FunctionToolItem[];
  isDependentOpen: boolean;
  onToggleDependent: (e?: React.MouseEvent) => void;
  openChildSchemaIds: Record<string, boolean>;
  onToggleChildSchema: (childId: string, e?: React.MouseEvent) => void;
  copiedChildId: string | null;
  onCopyChildSchema: (childTool: FunctionToolItem, e?: React.MouseEvent) => void;
  onToggleStatus: (tool: FunctionToolItem, e?: React.MouseEvent | React.ChangeEvent) => void;
}

export default function DependentToolsSection({
  dependentTools,
  isDependentOpen,
  onToggleDependent,
  openChildSchemaIds,
  onToggleChildSchema,
  copiedChildId,
  onCopyChildSchema,
  onToggleStatus,
}: DependentToolsSectionProps) {
  if (dependentTools.length === 0) return null;

  return (
    <div>
      <Button
        type="button"
        variant="ghost"
        onClick={onToggleDependent}
        style={{
          border: "1px solid var(--border)",
          borderRadius: isDependentOpen ? "6px 6px 0 0" : "6px",
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
          <Layers style={{ width: "14px", height: "14px", color: "var(--secondary)" }} />
          <span
            style={{
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              fontSize: "11px",
              color: "var(--muted-foreground)",
            }}
          >
            Dependent Tools ({dependentTools.length})
          </span>
        </div>
        {isDependentOpen ? (
          <ChevronUp style={{ width: "14px", height: "14px", color: "var(--muted-foreground)" }} />
        ) : (
          <ChevronDown style={{ width: "14px", height: "14px", color: "var(--muted-foreground)" }} />
        )}
      </Button>

      {isDependentOpen && (
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderTop: "none",
            borderRadius: "0 0 6px 6px",
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {dependentTools.map((depTool) => (
            <div
              key={depTool.id}
              style={{
                border: "1px solid var(--border)",
                borderRadius: "6px",
                padding: "10px 12px",
                background: "var(--background)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "8px",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <CornerDownRight style={{ width: "13px", height: "13px", color: "#742774" }} />
                    <span style={{ fontWeight: "600", fontSize: "13px", color: "var(--foreground)" }}>
                      {depTool.name}
                    </span>
                  </div>
                  <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--muted-foreground)" }}>
                    {depTool.description || "No description provided."}
                  </p>
                </div>

                <label
                  style={{
                    position: "relative",
                    display: "inline-block",
                    width: "36px",
                    height: "18px",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                  title={depTool.is_enabled ? "Active" : "Disabled"}
                >
                  <input
                    type="checkbox"
                    checked={depTool.is_enabled}
                    onChange={(e) => onToggleStatus(depTool, e)}
                    style={{ opacity: 0, width: 0, height: 0, position: "absolute" }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: depTool.is_enabled ? "var(--primary)" : "#e2e8f0",
                      transition: ".2s",
                      borderRadius: "18px",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        content: '""',
                        height: "14px",
                        width: "14px",
                        left: depTool.is_enabled ? "19px" : "2px",
                        bottom: "2px",
                        backgroundColor: "#ffffff",
                        transition: ".2s",
                        borderRadius: "50%",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
                      }}
                    />
                  </span>
                </label>
              </div>

              <div style={{ marginTop: "8px" }}>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={(e) => onToggleChildSchema(depTool.id, e)}
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: openChildSchemaIds[depTool.id] ? "6px 6px 0 0" : "6px",
                    padding: "4px 8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    fontSize: "11px",
                    height: "28px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Code style={{ width: "12px", height: "12px", color: "var(--secondary)" }} />
                    <span>Child Schema</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {openChildSchemaIds[depTool.id] && (
                      <span
                        onClick={(e) => onCopyChildSchema(depTool, e)}
                        style={{
                          color: "var(--secondary)",
                          fontSize: "10px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                        }}
                      >
                        {copiedChildId === depTool.id ? (
                          <Check style={{ width: "11px", height: "11px", color: "var(--primary)" }} />
                        ) : (
                          <Copy style={{ width: "11px", height: "11px" }} />
                        )}
                        <span>{copiedChildId === depTool.id ? "Copied!" : "Copy"}</span>
                      </span>
                    )}
                    {openChildSchemaIds[depTool.id] ? (
                      <ChevronUp style={{ width: "13px", height: "13px", color: "var(--muted-foreground)" }} />
                    ) : (
                      <ChevronDown style={{ width: "13px", height: "13px", color: "var(--muted-foreground)" }} />
                    )}
                  </div>
                </Button>

                {openChildSchemaIds[depTool.id] && (
                  <pre
                    style={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderTop: "none",
                      borderRadius: "0 0 6px 6px",
                      padding: "8px 12px",
                      fontSize: "11.5px",
                      fontFamily: "var(--font-mono)",
                      color: "var(--foreground)",
                      overflowX: "auto",
                      margin: 0,
                      lineHeight: "1.4",
                    }}
                  >
                    {formatSchemaJson(depTool.parameters_json)}
                  </pre>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
