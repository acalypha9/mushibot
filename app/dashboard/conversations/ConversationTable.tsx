"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Trash2
} from "lucide-react";
import { Conversation, SortColumn, SortDirection } from "./types";
import { ConversationRow } from "./ConversationRow";

interface ConversationTableProps {
  paginatedConversations: Conversation[];
  filteredCount: number;
  selectedIds: string[];
  onSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectOne: (id: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  onBulkDelete: () => void;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  onSort: (column: SortColumn) => void;
  editingConvId: string | null;
  editingTitle: string;
  onStartEditing: (id: string, currentTitle: string) => void;
  onEditingTitleChange: (val: string) => void;
  onSaveTitle: (id: string) => void;
  onCancelEditing: () => void;
  onOpenMessageLog: (id: string) => void;
  onDeleteConversation: (id: string, e: React.MouseEvent) => void;
}

export function ConversationTable({
  paginatedConversations,
  filteredCount,
  selectedIds,
  onSelectAll,
  onSelectOne,
  onBulkDelete,
  sortColumn,
  sortDirection,
  onSort,
  editingConvId,
  editingTitle,
  onStartEditing,
  onEditingTitleChange,
  onSaveTitle,
  onCancelEditing,
  onOpenMessageLog,
  onDeleteConversation
}: ConversationTableProps) {
  const isAllSelected = filteredCount > 0 && selectedIds.length === filteredCount;

  return (
    <>
      {/* ACTION BAR: UNDER CONVERSATION HISTORY & TOP OF TABLE */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingLeft: "17px" }}>
        <Input
          type="checkbox"
          onChange={onSelectAll}
          checked={isAllSelected}
          style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "#742774" }}
          title="Select All"
        />

        {selectedIds.length > 0 && (
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={onBulkDelete}
            style={{
              height: "20px",
              padding: "2px 8px",
              fontSize: "11px",
              fontWeight: "700",
              lineHeight: "1"
            }}
            title={`Delete ${selectedIds.length} selected item(s)`}
          >
            <Trash2 style={{ width: "12px", height: "12px" }} />
            <span>Delete ({selectedIds.length})</span>
          </Button>
        )}
      </div>

      {/* TABLE DATA CONTAINER */}
      <div style={{ overflowX: "auto", border: "1px solid #e1dfdd", borderRadius: "8px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
          <thead>
            <tr style={{ background: "#faf9f8", borderBottom: "1px solid #e1dfdd", color: "#605e5c", fontWeight: "600", userSelect: "none" }}>
              <th
                colSpan={2}
                onClick={() => onSort("title")}
                style={{ padding: "12px 16px", fontWeight: "600", color: "#323130", cursor: "pointer", transition: "color 0.15s ease", whiteSpace: "nowrap" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#742774")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#323130")}
              >
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <span>Conversation Title</span>
                  {sortColumn === "title" ? (
                    sortDirection === "asc" ? <ChevronUp style={{ width: "14px", height: "14px", color: "#742774" }} /> : <ChevronDown style={{ width: "14px", height: "14px", color: "#742774" }} />
                  ) : (
                    <ArrowUpDown style={{ width: "12px", height: "12px", opacity: 0.4 }} />
                  )}
                </div>
              </th>

              <th style={{ padding: "12px 16px", fontWeight: "600", color: "#323130", whiteSpace: "nowrap" }}>
                User
              </th>

              <th style={{ padding: "12px 16px", fontWeight: "600", color: "#323130", whiteSpace: "nowrap" }}>
                Channel
              </th>

              <th
                onClick={() => onSort("created_at")}
                style={{ padding: "12px 16px", fontWeight: "600", color: "#323130", cursor: "pointer", transition: "color 0.15s ease", whiteSpace: "nowrap" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#742774")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#323130")}
              >
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <span>Created At</span>
                  {sortColumn === "created_at" ? (
                    sortDirection === "asc" ? <ChevronUp style={{ width: "14px", height: "14px", color: "#742774" }} /> : <ChevronDown style={{ width: "14px", height: "14px", color: "#742774" }} />
                  ) : (
                    <ArrowUpDown style={{ width: "12px", height: "12px", opacity: 0.4 }} />
                  )}
                </div>
              </th>

              <th
                onClick={() => onSort("updated_at")}
                style={{ padding: "12px 16px", fontWeight: "600", color: "#323130", cursor: "pointer", transition: "color 0.15s ease", whiteSpace: "nowrap" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#742774")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#323130")}
              >
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <span>Updated At</span>
                  {sortColumn === "updated_at" ? (
                    sortDirection === "asc" ? <ChevronUp style={{ width: "14px", height: "14px", color: "#742774" }} /> : <ChevronDown style={{ width: "14px", height: "14px", color: "#742774" }} />
                  ) : (
                    <ArrowUpDown style={{ width: "12px", height: "12px", opacity: 0.4 }} />
                  )}
                </div>
              </th>

              <th style={{ padding: "12px 16px", fontWeight: "600", color: "#323130", textAlign: "right", whiteSpace: "nowrap" }}>
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {paginatedConversations.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>
                  No conversations found matching your criteria.
                </td>
              </tr>
            ) : (
              paginatedConversations.map((c) => (
                <ConversationRow
                  key={c.id}
                  conversation={c}
                  isSelectedRow={selectedIds.includes(c.id)}
                  onSelectOne={onSelectOne}
                  editingConvId={editingConvId}
                  editingTitle={editingTitle}
                  onStartEditing={onStartEditing}
                  onEditingTitleChange={onEditingTitleChange}
                  onSaveTitle={onSaveTitle}
                  onCancelEditing={onCancelEditing}
                  onOpenMessageLog={onOpenMessageLog}
                  onDeleteConversation={onDeleteConversation}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
