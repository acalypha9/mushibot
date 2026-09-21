"use client";

import React from "react";
import { FunctionToolItem } from "../types";
import DependentToolsSection from "./DependentToolsSection";
import ToolSchemaDropdown from "./ToolSchemaDropdown";
import { ChevronDown, ChevronUp, Layers } from "lucide-react";

interface FunctionToolRowProps {
  tool: FunctionToolItem;
  dependentTools: FunctionToolItem[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleStatus: (tool: FunctionToolItem, e?: React.MouseEvent | React.ChangeEvent) => void;
  isSchemaOpen: boolean;
  onToggleSchema: (e?: React.MouseEvent) => void;
  isCopied: boolean;
  onCopySchema: (tool: FunctionToolItem, e?: React.MouseEvent) => void;
  isDependentOpen: boolean;
  onToggleDependent: (e?: React.MouseEvent) => void;
  openChildSchemaIds: Record<string, boolean>;
  onToggleChildSchema: (childId: string, e?: React.MouseEvent) => void;
  copiedChildId: string | null;
  onCopyChildSchema: (childTool: FunctionToolItem, e?: React.MouseEvent) => void;
}

export default function FunctionToolRow({
  tool,
  dependentTools,
  isExpanded,
  onToggleExpand,
  onToggleStatus,
  isSchemaOpen,
  onToggleSchema,
  isCopied,
  onCopySchema,
  isDependentOpen,
  onToggleDependent,
  openChildSchemaIds,
  onToggleChildSchema,
  copiedChildId,
  onCopyChildSchema,
}: FunctionToolRowProps) {
  return (
    <>
      <tr
        onClick={onToggleExpand}
        style={{
          borderBottom: isExpanded ? "none" : "1px solid #f3f2f1",
          background: isExpanded ? "#faf9f8" : "#ffffff",
          cursor: "pointer",
        }}
      >
        <td style={{ padding: "12px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontWeight: "600",
                color: "#323130",
                fontSize: "13.5px",
                fontFamily: "var(--font-body)",
              }}
            >
              {tool.name}
            </span>
            {dependentTools.length > 0 && (
              <span
                style={{
                  fontSize: "11px",
                  padding: "2px 8px",
                  borderRadius: "10px",
                  background: "#efe5ef",
                  color: "#742774",
                  fontWeight: "600",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Layers style={{ width: "12px", height: "12px" }} /> {dependentTools.length} Dependent{" "}
                {dependentTools.length === 1 ? "Tool" : "Tools"}
              </span>
            )}
            <span style={{ color: "#605e5c", display: "inline-flex", alignItems: "center", marginLeft: "4px" }}>
              {isExpanded ? (
                <ChevronUp style={{ width: "16px", height: "16px" }} />
              ) : (
                <ChevronDown style={{ width: "16px", height: "16px" }} />
              )}
            </span>
          </div>
        </td>

        <td
          style={{ padding: "12px 16px", textAlign: "right", width: "100px" }}
          onClick={(e) => e.stopPropagation()}
        >
          <label
            style={{
              position: "relative",
              display: "inline-block",
              width: "42px",
              height: "22px",
              cursor: "pointer",
            }}
            title={tool.is_enabled ? "Active" : "Disabled"}
          >
            <input
              type="checkbox"
              checked={tool.is_enabled}
              onChange={(e) => onToggleStatus(tool, e)}
              style={{ opacity: 0, width: 0, height: 0, position: "absolute" }}
            />
            <span
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: tool.is_enabled ? "var(--primary)" : "#e2e8f0",
                transition: ".2s",
                borderRadius: "22px",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  content: '""',
                  height: "16px",
                  width: "16px",
                  left: tool.is_enabled ? "23px" : "3px",
                  bottom: "3px",
                  backgroundColor: "#ffffff",
                  transition: ".2s",
                  borderRadius: "50%",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                }}
              />
            </span>
          </label>
        </td>
      </tr>

      {isExpanded && (
        <tr style={{ background: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
          <td colSpan={2} style={{ padding: "16px 20px 20px 20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <span
                  style={{
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    fontWeight: "700",
                    color: "var(--muted-foreground)",
                  }}
                >
                  Tool Description
                </span>
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--foreground)",
                    marginTop: "4px",
                    margin: 0,
                    lineHeight: "1.5",
                  }}
                >
                  {tool.description || "No description provided."}
                </p>
              </div>

              <ToolSchemaDropdown
                tool={tool}
                isOpen={isSchemaOpen}
                onToggle={onToggleSchema}
                isCopied={isCopied}
                onCopy={onCopySchema}
              />

              <DependentToolsSection
                parentToolId={tool.id}
                dependentTools={dependentTools}
                isDependentOpen={isDependentOpen}
                onToggleDependent={onToggleDependent}
                openChildSchemaIds={openChildSchemaIds}
                onToggleChildSchema={onToggleChildSchema}
                copiedChildId={copiedChildId}
                onCopyChildSchema={onCopyChildSchema}
                onToggleStatus={onToggleStatus}
              />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
