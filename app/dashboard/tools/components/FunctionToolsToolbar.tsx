"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { RefreshCw, X, Search } from "lucide-react";

interface FunctionToolsToolbarProps {
  toolCount: number;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  searchInput: string;
  setSearchInput: (val: string) => void;
  setSearchQuery: (val: string) => void;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  loading: boolean;
  onRefresh: () => void;
}

export default function FunctionToolsToolbar({
  toolCount,
  statusFilter,
  setStatusFilter,
  searchInput,
  setSearchInput,
  setSearchQuery,
  setCurrentPage,
  loading,
  onRefresh,
}: FunctionToolsToolbarProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
        <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#323130", margin: 0 }}>
          Function Tools
        </h2>
        <span
          style={{
            background: "#efe5ef",
            color: "#742774",
            borderRadius: "12px",
            padding: "2px 8px",
            fontSize: "12px",
            fontWeight: "700",
          }}
        >
          {toolCount}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "nowrap" }}>
        <Select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          style={{ width: "140px", height: "36px", fontSize: "13px", padding: "0 28px 0 10px", flexShrink: 0 }}
        >
          <option value="all">All Status</option>
          <option value="enabled">Enabled Only</option>
          <option value="disabled">Disabled Only</option>
        </Select>

        <div style={{ position: "relative", display: "flex", alignItems: "center", width: "200px", flexShrink: 0 }}>
          <Search
            style={{
              position: "absolute",
              left: "10px",
              width: "14px",
              height: "14px",
              color: "#605e5c",
              pointerEvents: "none",
            }}
          />
          <Input
            type="text"
            placeholder="Search tools..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              if (!e.target.value) {
                setSearchQuery("");
                setCurrentPage(1);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                setSearchQuery(searchInput.trim());
                setCurrentPage(1);
              }
            }}
            style={{
              paddingLeft: "32px",
              paddingRight: searchInput ? "28px" : "10px",
              width: "100%",
              height: "36px",
              fontSize: "13px",
            }}
          />
          {searchInput && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchInput("");
                setSearchQuery("");
                setCurrentPage(1);
              }}
              style={{
                position: "absolute",
                right: "6px",
                top: "50%",
                transform: "translateY(-50%)",
                padding: "2px",
                height: "auto",
                minHeight: "unset",
              }}
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
          <RefreshCw
            style={{
              width: "13px",
              height: "13px",
              animation: loading ? "spin 1s linear infinite" : "none",
            }}
          />
          <span>Refresh</span>
        </Button>
      </div>
    </div>
  );
}
