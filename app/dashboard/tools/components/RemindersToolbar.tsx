"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Search, X, RefreshCw, Plus } from "lucide-react";
import styles from "./RemindersTab.module.css";

interface RemindersToolbarProps {
  reminderCount: number;
  channelFilter: string;
  setChannelFilter: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  searchInput: string;
  setSearchInput: (val: string) => void;
  setSearchTerm: (val: string) => void;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  loading: boolean;
  onRefresh: () => void;
  onOpenAddModal: () => void;
}

export default function RemindersToolbar({
  reminderCount,
  channelFilter,
  setChannelFilter,
  statusFilter,
  setStatusFilter,
  searchInput,
  setSearchInput,
  setSearchTerm,
  setCurrentPage,
  loading,
  onRefresh,
  onOpenAddModal,
}: RemindersToolbarProps) {
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
          Scheduled Reminders
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
          {reminderCount}
        </span>
      </div>

      <div className={styles.toolbarControls} style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "nowrap" }}>
        <Select
          value={channelFilter}
          onChange={(e) => {
            setChannelFilter(e.target.value);
            setCurrentPage(1);
          }}
          style={{ width: "135px", height: "36px", fontSize: "13px", padding: "0 28px 0 10px", flexShrink: 0 }}
        >
          <option value="all">All Channels</option>
          <option value="WHATSAPP">WhatsApp</option>
          <option value="TELEGRAM">Telegram</option>
        </Select>

        <Select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          style={{ width: "130px", height: "36px", fontSize: "13px", padding: "0 28px 0 10px", flexShrink: 0 }}
        >
          <option value="all">All Status</option>
          <option value="active">Enabled Only</option>
          <option value="inactive">Disabled Only</option>
        </Select>

        <div style={{ position: "relative", display: "flex", alignItems: "center", width: "190px", flexShrink: 0 }}>
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
            placeholder="Search Keywords..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              if (!e.target.value) {
                setSearchTerm("");
                setCurrentPage(1);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                setSearchTerm(searchInput.trim());
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
                setSearchTerm("");
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
          title="Refresh reminders"
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

        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={onOpenAddModal}
          style={{
            height: "36px",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            flexShrink: 0,
            padding: "0 14px",
            fontSize: "13px",
          }}
        >
          <Plus style={{ width: "15px", height: "15px" }} />
          <span>Add Reminder</span>
        </Button>
      </div>
    </div>
  );
}
