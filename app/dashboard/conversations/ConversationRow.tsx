"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Edit3, Check, X, Eye, Trash2 } from "lucide-react";
import { formatDateLocale as formatDateCustom } from "@/lib/utils/formatters";
import { Conversation } from "./types";
import { getUserDisplay, getConversationTitleDisplay } from "./helpers";

interface ConversationRowProps {
  conversation: Conversation;
  isSelectedRow: boolean;
  onSelectOne: (id: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  editingConvId: string | null;
  editingTitle: string;
  onStartEditing: (id: string, currentTitle: string) => void;
  onEditingTitleChange: (val: string) => void;
  onSaveTitle: (id: string) => void;
  onCancelEditing: () => void;
  onOpenMessageLog: (id: string) => void;
  onDeleteConversation: (id: string, e: React.MouseEvent) => void;
}

export function ConversationRow({
  conversation: c,
  isSelectedRow,
  onSelectOne,
  editingConvId,
  editingTitle,
  onStartEditing,
  onEditingTitleChange,
  onSaveTitle,
  onCancelEditing,
  onOpenMessageLog,
  onDeleteConversation
}: ConversationRowProps) {
  const titleText = getConversationTitleDisplay(c);
  const channelCode = (c.channel || "web").toLowerCase() === "web" ? "webchat" : c.channel.toLowerCase();

  return (
    <tr
      style={{
        borderBottom: "1px solid #f3f2f1",
        background: isSelectedRow ? "#efe5ef" : "#ffffff",
        transition: "background 0.15s ease"
      }}
      onMouseEnter={(e) => {
        if (!isSelectedRow) e.currentTarget.style.background = "#faf9f8";
      }}
      onMouseLeave={(e) => {
        if (!isSelectedRow) e.currentTarget.style.background = "#ffffff";
      }}
    >
      <td style={{ padding: "12px 16px", width: "40px" }}>
        <Input
          type="checkbox"
          checked={isSelectedRow}
          onChange={(e) => onSelectOne(c.id, e)}
          style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "#742774" }}
        />
      </td>

      <td style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {editingConvId === c.id ? (
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }} onClick={(e) => e.stopPropagation()}>
                <Input
                  type="text"
                  value={editingTitle}
                  onChange={(e) => onEditingTitleChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSaveTitle(c.id);
                  }}
                  style={{
                    padding: "2px 6px",
                    fontSize: "13px",
                    border: "1px solid #742774"
                  }}
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSaveTitle(c.id)}
                  style={{ color: "#742774", padding: "2px" }}
                >
                  <Check style={{ width: "14px", height: "14px" }} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCancelEditing}
                  style={{ color: "#64748b", padding: "2px" }}
                >
                  <X style={{ width: "14px", height: "14px" }} />
                </Button>
              </div>
            ) : (
              <>
                <span
                  onClick={() => onOpenMessageLog(c.id)}
                  style={{
                    fontWeight: "600",
                    fontSize: "13.5px",
                    color: "#323130",
                    cursor: "pointer",
                    textDecoration: "none"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#742774")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#323130")}
                >
                  {titleText}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartEditing(c.id, titleText);
                  }}
                  style={{ color: "#94a3b8", padding: "2px" }}
                  title="Edit title"
                >
                  <Edit3 style={{ width: "13px", height: "13px" }} />
                </Button>
              </>
            )}
          </div>
          <span style={{ fontSize: "11px", color: "#94a3b8", fontFamily: "var(--font-mono)" }}>
            {c.id}
          </span>
        </div>
      </td>

      <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
        {(() => {
          const userDisplay = getUserDisplay(c);
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{ color: "#323130", fontSize: "13px", fontWeight: "600" }}>
                {userDisplay.primary}
              </span>
              {userDisplay.secondary && (
                <span style={{ fontSize: "11px", color: "#605e5c" }}>
                  {userDisplay.secondary}
                </span>
              )}
            </div>
          );
        })()}
      </td>

      <td style={{ padding: "14px 16px", color: "#334155", fontSize: "13px", fontWeight: "500", whiteSpace: "nowrap" }}>
        {channelCode}
      </td>

      <td style={{ padding: "14px 16px", color: "#475569", fontSize: "12.5px", whiteSpace: "nowrap" }}>
        {formatDateCustom(c.created_at)}
      </td>

      <td style={{ padding: "14px 16px", color: "#475569", fontSize: "12.5px", whiteSpace: "nowrap" }}>
        {formatDateCustom(c.updated_at || c.created_at)}
      </td>

      <td style={{ padding: "14px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "8px" }} onClick={(e) => e.stopPropagation()}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenMessageLog(c.id)}
            style={{ color: "#64748b", padding: "6px" }}
            title="View Message Log"
          >
            <Eye style={{ width: "16px", height: "16px" }} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => onDeleteConversation(c.id, e)}
            style={{ color: "#e15a64", padding: "6px" }}
            title="Delete Conversation"
          >
            <Trash2 style={{ width: "16px", height: "16px" }} />
          </Button>
        </div>
      </td>
    </tr>
  );
}
