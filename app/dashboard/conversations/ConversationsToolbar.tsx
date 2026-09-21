"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Search, RefreshCw, X, LayoutList, Columns } from "lucide-react";
import { ViewMode } from "./types";

interface ConversationsToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  filteredCount: number;
  platformFilter: string;
  onPlatformFilterChange: (val: string) => void;
  typeFilter: string;
  onTypeFilterChange: (val: string) => void;
  searchInput: string;
  onSearchInputChange: (val: string) => void;
  onSearchSubmit: (term: string) => void;
  onClearSearch: () => void;
  onRefresh: () => void;
  loading: boolean;
}

export function ConversationsToolbar({
  viewMode,
  onViewModeChange,
  filteredCount,
  platformFilter,
  onPlatformFilterChange,
  typeFilter,
  onTypeFilterChange,
  searchInput,
  onSearchInputChange,
  onSearchSubmit,
  onClearSearch,
  onRefresh,
  loading
}: ConversationsToolbarProps) {
  return (
    <>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#323130", marginTop: "4px", letterSpacing: "-0.01em" }}>
            Conversations
          </h1>
          <p style={{ fontSize: "13px", color: "#605e5c", marginTop: "4px" }}>
            Review customer interactions, vector queries, and live chat states.
          </p>
        </div>

        <div style={{ display: "flex", background: "#f3f2f1", padding: "3px", borderRadius: "6px", gap: "2px" }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewModeChange("table")}
            style={{
              background: viewMode === "table" ? "#ffffff" : "transparent",
              color: viewMode === "table" ? "#742774" : "#605e5c",
              fontWeight: "600",
              fontSize: "12px",
              boxShadow: viewMode === "table" ? "0 1px 2px rgba(0,0,0,0.05)" : "none"
            }}
          >
            <LayoutList style={{ width: "14px", height: "14px" }} /> Table View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewModeChange("split")}
            style={{
              background: viewMode === "split" ? "#ffffff" : "transparent",
              color: viewMode === "split" ? "#742774" : "#605e5c",
              fontWeight: "600",
              fontSize: "12px",
              boxShadow: viewMode === "split" ? "0 1px 2px rgba(0,0,0,0.05)" : "none"
            }}
          >
            <Columns style={{ width: "14px", height: "14px" }} /> Split Log View
          </Button>
        </div>
      </header>

      {viewMode === "table" && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#323130", margin: 0 }}>
              Conversation History
            </h2>
            <span style={{ background: "#efe5ef", color: "#742774", borderRadius: "12px", padding: "2px 8px", fontSize: "12px", fontWeight: "700" }}>
              {filteredCount}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "nowrap" }}>
            <Select
              value={platformFilter}
              onChange={(e) => onPlatformFilterChange(e.target.value)}
              style={{ width: "130px", height: "36px", fontSize: "13px", padding: "0 28px 0 10px", flexShrink: 0 }}
            >
              <option value="all">Platform</option>
              <option value="web">Webchat</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="mobile">Mobile</option>
              <option value="api">API</option>
            </Select>

            <Select
              value={typeFilter}
              onChange={(e) => onTypeFilterChange(e.target.value)}
              style={{ width: "120px", height: "36px", fontSize: "13px", padding: "0 28px 0 10px", flexShrink: 0 }}
            >
              <option value="all">Type</option>
              <option value="open">Open</option>
              <option value="active">Active</option>
              <option value="resolved">Resolved</option>
            </Select>

            <div style={{ position: "relative", display: "flex", alignItems: "center", width: "200px", flexShrink: 0 }}>
              <Search style={{ position: "absolute", left: "10px", width: "14px", height: "14px", color: "#605e5c", pointerEvents: "none" }} />
              <Input
                type="text"
                placeholder="Search Keywords..."
                value={searchInput}
                onChange={(e) => {
                  onSearchInputChange(e.target.value);
                  if (!e.target.value) onClearSearch();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onSearchSubmit(searchInput.trim());
                  }
                }}
                style={{
                  paddingLeft: "32px",
                  paddingRight: searchInput ? "28px" : "10px",
                  width: "100%",
                  height: "36px",
                  fontSize: "13px"
                }}
              />
              {searchInput && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearSearch}
                  style={{ position: "absolute", right: "6px", top: "50%", transform: "translateY(-50%)", padding: "2px", height: "auto", minHeight: "unset" }}
                >
                  <X style={{ width: "13px", height: "13px" }} />
                </Button>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
              style={{ height: "36px", display: "inline-flex", alignItems: "center", gap: "6px", flexShrink: 0, padding: "0 12px" }}
            >
              <RefreshCw style={{ width: "13px", height: "13px", animation: loading ? "spin 1s linear infinite" : "none" }} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
