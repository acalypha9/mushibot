"use client";

import React, { useState } from "react";
import { FunctionToolItem } from "../types";
import FunctionToolsToolbar from "./FunctionToolsToolbar";
import FunctionToolRow from "./FunctionToolRow";
import ToolsPagination from "./ToolsPagination";
import { ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react";

interface FunctionToolsTabProps {
  tools: FunctionToolItem[];
  topLevelTools: FunctionToolItem[];
  paginatedTopLevelTools: FunctionToolItem[];
  loading: boolean;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  searchInput: string;
  setSearchInput: (val: string) => void;
  setSearchQuery: (val: string) => void;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  itemsPerPage: number;
  setItemsPerPage: (val: number) => void;
  totalItems: number;
  totalPages: number;
  startIndex: number;
  sortColumn: string;
  sortDirection: "asc" | "desc";
  handleSort: (col: string) => void;
  fetchTools: (silent?: boolean) => void;
  handleToggle: (tool: FunctionToolItem, e?: React.MouseEvent | React.ChangeEvent) => void;
  expandedRowId: string | null;
  setExpandedRowId: React.Dispatch<React.SetStateAction<string | null>>;
  openDependentToolsIds: Record<string, boolean>;
  setOpenDependentToolsIds: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  DEPENDENT_TOOL_MAP: Record<string, string>;
}

export default function FunctionToolsTab({
  tools,
  topLevelTools,
  paginatedTopLevelTools,
  loading,
  statusFilter,
  setStatusFilter,
  searchInput,
  setSearchInput,
  setSearchQuery,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  setItemsPerPage,
  totalItems,
  totalPages,
  startIndex,
  sortColumn,
  sortDirection,
  handleSort,
  fetchTools,
  handleToggle,
  expandedRowId,
  setExpandedRowId,
  openDependentToolsIds,
  setOpenDependentToolsIds,
  DEPENDENT_TOOL_MAP,
}: FunctionToolsTabProps) {
  const [openSchemaIds, setOpenSchemaIds] = useState<Record<string, boolean>>({});
  const [copiedToolId, setCopiedToolId] = useState<string | null>(null);

  const toggleSchemaDropdown = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setOpenSchemaIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleDependentToolsDropdown = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setOpenDependentToolsIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyToolSchemaText = (tool: FunctionToolItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(tool.parameters_json || "{}");
    setCopiedToolId(tool.id);
    setTimeout(() => setCopiedToolId(null), 2000);
  };

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "8px",
        border: "1px solid #e1dfdd",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <FunctionToolsToolbar
        toolCount={topLevelTools.length}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        setSearchQuery={setSearchQuery}
        setCurrentPage={setCurrentPage}
        loading={loading}
        onRefresh={() => fetchTools(false)}
      />

      <div style={{ overflowX: "auto", border: "1px solid #e1dfdd", borderRadius: "8px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
          <thead>
            <tr
              style={{
                background: "#faf9f8",
                borderBottom: "1px solid #e1dfdd",
                color: "#605e5c",
                fontWeight: "600",
                userSelect: "none",
              }}
            >
              <th
                onClick={() => handleSort("name")}
                style={{
                  padding: "12px 16px",
                  fontWeight: "600",
                  color: "#323130",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <span>Function Tool</span>
                  {sortColumn === "name" ? (
                    sortDirection === "asc" ? (
                      <ChevronUp style={{ width: "14px", height: "14px", color: "#742774" }} />
                    ) : (
                      <ChevronDown style={{ width: "14px", height: "14px", color: "#742774" }} />
                    )
                  ) : (
                    <ArrowUpDown style={{ width: "12px", height: "12px", opacity: 0.4 }} />
                  )}
                </div>
              </th>

              <th
                style={{
                  padding: "12px 16px",
                  fontWeight: "600",
                  color: "#323130",
                  whiteSpace: "nowrap",
                  textAlign: "right",
                  width: "100px",
                }}
              >
                <span>Toggle</span>
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={2} style={{ padding: "32px", textAlign: "center", color: "var(--muted-foreground)" }}>
                  Loading function tools...
                </td>
              </tr>
            ) : paginatedTopLevelTools.length === 0 ? (
              <tr>
                <td colSpan={2} style={{ padding: "32px", textAlign: "center", color: "var(--muted-foreground)" }}>
                  No function tools found matching your search criteria.
                </td>
              </tr>
            ) : (
              paginatedTopLevelTools.map((tool) => {
                const isExpanded = expandedRowId === tool.id;
                const dependentTools = tools.filter((child) => DEPENDENT_TOOL_MAP[child.name] === tool.name);

                return (
                  <FunctionToolRow
                    key={tool.id}
                    tool={tool}
                    dependentTools={dependentTools}
                    isExpanded={isExpanded}
                    onToggleExpand={() => setExpandedRowId((prev) => (prev === tool.id ? null : tool.id))}
                    onToggleStatus={handleToggle}
                    isSchemaOpen={Boolean(openSchemaIds[tool.id])}
                    onToggleSchema={(e) => toggleSchemaDropdown(tool.id, e)}
                    isCopied={copiedToolId === tool.id}
                    onCopySchema={handleCopyToolSchemaText}
                    isDependentOpen={Boolean(openDependentToolsIds[tool.id])}
                    onToggleDependent={(e) => toggleDependentToolsDropdown(tool.id, e)}
                    openChildSchemaIds={openSchemaIds}
                    onToggleChildSchema={toggleSchemaDropdown}
                    copiedChildId={copiedToolId}
                    onCopyChildSchema={handleCopyToolSchemaText}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <ToolsPagination
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        totalItems={totalItems}
        totalPages={totalPages}
        startIndex={startIndex}
      />
    </div>
  );
}
