"use client";

import React, { useState, useMemo, useEffect } from "react";
import Button from "@/components/ui/Button";
import { Users, X, RefreshCw, Search } from "lucide-react";
import { WaGroupItem } from "../types";

export interface GroupPickerPopoverProps {
  title: string;
  buttonText: string;
  buttonVariant?: "outline" | "ghost" | "primary" | "danger";
  accentColor?: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onRefresh?: () => void;
  loading: boolean;
  groups: WaGroupItem[];
  onSelectGroup: (groupId: string) => void;
}

export default function GroupPickerPopover({
  title,
  buttonText,
  buttonVariant = "outline",
  accentColor = "#742774",
  containerRef,
  isOpen,
  onToggle,
  onClose,
  onRefresh,
  loading,
  groups,
  onSelectGroup,
}: GroupPickerPopoverProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Clear search on close
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter(
      (g) =>
        g.subject.toLowerCase().includes(q) ||
        g.id.toLowerCase().includes(q)
    );
  }, [groups, searchQuery]);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <Button
        type="button"
        variant={buttonVariant}
        size="sm"
        onClick={onToggle}
        title={buttonText}
      >
        <Users style={{ width: "12px", height: "12px" }} />
        <span>{buttonText}</span>
      </Button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "100%",
            marginTop: "6px",
            width: "320px",
            maxHeight: "360px",
            display: "flex",
            flexDirection: "column",
            background: "#ffffff",
            borderRadius: "8px",
            border: "1px solid #e1dfdd",
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            zIndex: 1000,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              fontSize: "11.5px",
              fontWeight: "700",
              color: "#323130",
              padding: "8px 10px",
              borderBottom: "1px solid #f3f2f1",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#faf9f8",
            }}
          >
            <span>
              {title} {groups.length > 0 ? `(${groups.length})` : ""}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              {onRefresh && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRefresh();
                  }}
                  disabled={loading}
                  title="Fetch latest groups from WhatsApp"
                  style={{ padding: "4px", minWidth: "auto", height: "auto" }}
                >
                  <RefreshCw
                    style={{
                      width: "12px",
                      height: "12px",
                      animation: loading ? "spin 1s linear infinite" : "none",
                      color: "#605e5c",
                    }}
                  />
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                style={{ padding: "4px", minWidth: "auto", height: "auto" }}
              >
                <X style={{ width: "12px", height: "12px", color: "#605e5c" }} />
              </Button>
            </div>
          </div>

          {/* Search Box */}
          <div style={{ padding: "6px 8px", borderBottom: "1px solid #edebe9", background: "#ffffff" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "#f3f2f1",
                borderRadius: "4px",
                padding: "3px 8px",
                border: "1px solid #e1dfdd",
              }}
            >
              <Search style={{ width: "12px", height: "12px", color: "#8a8886", flexShrink: 0 }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search group by name or ID..."
                autoFocus
                style={{
                  width: "100%",
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  fontSize: "11px",
                  color: "#323130",
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    padding: 0,
                    color: "#8a8886",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <X style={{ width: "10px", height: "10px" }} />
                </button>
              )}
            </div>
          </div>

          {/* Body / List */}
          <div
            style={{
              overflowY: "auto",
              padding: "6px",
              maxHeight: "260px",
              flex: 1,
            }}
          >
            {loading && groups.length === 0 ? (
              <div style={{ padding: "20px 12px", textAlign: "center", fontSize: "12px", color: "#8a8886" }}>
                <RefreshCw
                  style={{
                    width: "16px",
                    height: "16px",
                    animation: "spin 1s linear infinite",
                    margin: "0 auto 8px auto",
                    display: "block",
                  }}
                />
                Fetching groups live from WhatsApp...
              </div>
            ) : filteredGroups.length === 0 ? (
              <div style={{ padding: "20px 12px", textAlign: "center", fontSize: "12px", color: "#8a8886" }}>
                {searchQuery ? `No groups match "${searchQuery}"` : "No groups found on this WhatsApp channel."}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                {filteredGroups.map((g) => (
                  <Button
                    key={g.id}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onSelectGroup(g.id);
                      onClose();
                    }}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      textAlign: "left",
                      height: "auto",
                      padding: "7px 9px",
                      width: "100%",
                      borderRadius: "5px",
                    }}
                  >
                    <div style={{ fontWeight: "600", fontSize: "12px", color: "#323130", wordBreak: "break-word" }}>
                      {g.subject}
                    </div>
                    <div
                      style={{
                        fontSize: "10.5px",
                        color: accentColor,
                        fontFamily: "var(--font-mono)",
                        marginTop: "2px",
                        wordBreak: "break-all",
                      }}
                    >
                      {g.id}
                    </div>
                    <div style={{ fontSize: "10px", color: "#8a8886", marginTop: "1px" }}>
                      {g.participantsCount} participants
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
