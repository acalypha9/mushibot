"use client";

import React from "react";
import { CronReminderItem, ChannelOption } from "../types";
import ReminderKpiStats from "./ReminderKpiStats";
import RemindersToolbar from "./RemindersToolbar";
import ReminderRow from "./ReminderRow";
import ToolsPagination from "./ToolsPagination";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowUpDown, Loader2, Trash2 } from "lucide-react";
import styles from "./RemindersTab.module.css";

interface RemindersTabProps {
  reminders: CronReminderItem[];
  availableChannels: ChannelOption[];
  loadingReminders: boolean;
  reminderChannelFilter: string;
  setReminderChannelFilter: (val: string) => void;
  reminderStatusFilter: string;
  setReminderStatusFilter: (val: string) => void;
  reminderSearchInput: string;
  setReminderSearchInput: (val: string) => void;
  reminderSearchTerm: string;
  setReminderSearchTerm: (val: string) => void;
  reminderSortColumn: "created_at" | "title" | "channel" | "next_run" | "status";
  setReminderSortColumn: (col: "created_at" | "title" | "channel" | "next_run" | "status") => void;
  reminderSortDirection: "asc" | "desc";
  setReminderSortDirection: React.Dispatch<React.SetStateAction<"asc" | "desc">>;
  reminderCurrentPage: number;
  setReminderCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  reminderItemsPerPage: number;
  setReminderItemsPerPage: (val: number) => void;
  selectedReminderIds: string[];
  setSelectedReminderIds: React.Dispatch<React.SetStateAction<string[]>>;
  onBulkDelete: () => void;
  triggeringReminderId: string | null;
  fetchReminders: (silent?: boolean) => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (rem: CronReminderItem) => void;
  onToggleStatus: (rem: CronReminderItem, e?: React.SyntheticEvent) => void;
  onTriggerNow: (rem: CronReminderItem, e?: React.MouseEvent) => void;
  onDeleteTarget: (rem: CronReminderItem) => void;
}

export default function RemindersTab({
  reminders,
  availableChannels,
  loadingReminders,
  reminderChannelFilter,
  setReminderChannelFilter,
  reminderStatusFilter,
  setReminderStatusFilter,
  reminderSearchInput,
  setReminderSearchInput,
  reminderSearchTerm,
  setReminderSearchTerm,
  reminderSortColumn,
  setReminderSortColumn,
  reminderSortDirection,
  setReminderSortDirection,
  reminderCurrentPage,
  setReminderCurrentPage,
  reminderItemsPerPage,
  setReminderItemsPerPage,
  selectedReminderIds,
  setSelectedReminderIds,
  onBulkDelete,
  triggeringReminderId,
  fetchReminders,
  onOpenAddModal,
  onOpenEditModal,
  onToggleStatus,
  onTriggerNow,
  onDeleteTarget,
}: RemindersTabProps) {
  const filteredReminders = reminders.filter((rem) => {
    const matchesPlatform =
      reminderChannelFilter === "all" || rem.channel_type.toLowerCase() === reminderChannelFilter.toLowerCase();
    const matchesStatus =
      reminderStatusFilter === "all" ||
      (reminderStatusFilter === "active" && rem.is_active) ||
      (reminderStatusFilter === "inactive" && !rem.is_active);

    const term = reminderSearchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      (rem.title && rem.title.toLowerCase().includes(term)) ||
      (rem.description && rem.description.toLowerCase().includes(term)) ||
      (rem.message && rem.message.toLowerCase().includes(term)) ||
      (rem.target_recipients && rem.target_recipients.toLowerCase().includes(term)) ||
      (rem.channel_type && rem.channel_type.toLowerCase().includes(term)) ||
      (rem.id && rem.id.toLowerCase().includes(term));

    return matchesSearch && matchesPlatform && matchesStatus;
  });

  const sortedReminders = [...filteredReminders].sort((a, b) => {
    let valA: string | number = "";
    let valB: string | number = "";
    if (reminderSortColumn === "created_at") {
      valA = a.created_at ? new Date(a.created_at).getTime() : 0;
      valB = b.created_at ? new Date(b.created_at).getTime() : 0;
    } else if (reminderSortColumn === "title") {
      valA = (a.title || "").toLowerCase();
      valB = (b.title || "").toLowerCase();
    } else if (reminderSortColumn === "channel") {
      valA = (a.channel_type || "").toLowerCase();
      valB = (b.channel_type || "").toLowerCase();
    } else if (reminderSortColumn === "next_run") {
      valA = a.next_run_at ? new Date(a.next_run_at).getTime() : 0;
      valB = b.next_run_at ? new Date(b.next_run_at).getTime() : 0;
    } else if (reminderSortColumn === "status") {
      valA = a.is_active ? 1 : 0;
      valB = b.is_active ? 1 : 0;
    }
    if (valA < valB) return reminderSortDirection === "asc" ? -1 : 1;
    if (valA > valB) return reminderSortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const totalFiltered = sortedReminders.length;
  const totalPages = Math.ceil(totalFiltered / reminderItemsPerPage) || 1;
  const startIdx = (reminderCurrentPage - 1) * reminderItemsPerPage;
  const paginatedReminders = sortedReminders.slice(startIdx, startIdx + reminderItemsPerPage);

  const isAllSelected = filteredReminders.length > 0 && selectedReminderIds.length === filteredReminders.length;

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedReminderIds(e.target.checked ? filteredReminders.map((r) => r.id) : []);
  };

  const handleSelectOne = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setSelectedReminderIds((prev) =>
      e.target.checked ? [...prev, id] : prev.filter((item) => item !== id)
    );
  };

  const toggleSort = (col: "created_at" | "title" | "channel" | "next_run" | "status") => {
    if (reminderSortColumn === col) {
      setReminderSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setReminderSortColumn(col);
      setReminderSortDirection("asc");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <ReminderKpiStats reminders={reminders} availableChannels={availableChannels} />

      <div
        className={styles.panel}
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
        <RemindersToolbar
          reminderCount={reminders.length}
          channelFilter={reminderChannelFilter}
          setChannelFilter={setReminderChannelFilter}
          statusFilter={reminderStatusFilter}
          setStatusFilter={setReminderStatusFilter}
          searchInput={reminderSearchInput}
          setSearchInput={setReminderSearchInput}
          setSearchTerm={setReminderSearchTerm}
          setCurrentPage={setReminderCurrentPage}
          loading={loadingReminders}
          onRefresh={() => fetchReminders(false)}
          onOpenAddModal={onOpenAddModal}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* ACTION BAR: UNDER SCHEDULED REMINDERS & TOP OF TABLE */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingLeft: "17px" }}>
            <Input
              type="checkbox"
              onChange={handleSelectAll}
              checked={isAllSelected}
              style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "#742774" }}
              title="Select All"
            />

            {selectedReminderIds.length > 0 && (
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
                  lineHeight: "1",
                }}
                title={`Delete ${selectedReminderIds.length} selected item(s)`}
              >
                <Trash2 style={{ width: "12px", height: "12px" }} />
                <span>Delete ({selectedReminderIds.length})</span>
              </Button>
            )}
          </div>

          <div className={styles.tableViewport} style={{ overflowX: "auto", border: "1px solid #e1dfdd", borderRadius: "6px" }}>
            <table className={styles.remindersTable} style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f3f2f1", borderBottom: "1px solid #e1dfdd", color: "#605e5c" }}>
                  <th
                    colSpan={2}
                    onClick={() => toggleSort("created_at")}
                    style={{ padding: "12px 16px", fontWeight: "600", cursor: "pointer", width: "280px" }}
                  >
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      Reminder
                      <ArrowUpDown style={{ width: "12px", height: "12px", opacity: 0.5 }} />
                    </div>
                  </th>

                  <th style={{ padding: "12px 16px", fontWeight: "600", width: "190px" }}>Schedule</th>

                  <th
                    onClick={() => toggleSort("channel")}
                    style={{ padding: "12px 16px", fontWeight: "600", cursor: "pointer", width: "180px" }}
                  >
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      Target Channel
                      <ArrowUpDown style={{ width: "12px", height: "12px", opacity: 0.5 }} />
                    </div>
                  </th>

                  <th
                    onClick={() => toggleSort("next_run")}
                    style={{ padding: "12px 16px", fontWeight: "600", cursor: "pointer", width: "150px" }}
                  >
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      Next Run
                      <ArrowUpDown style={{ width: "12px", height: "12px", opacity: 0.5 }} />
                    </div>
                  </th>

                  <th
                    onClick={() => toggleSort("status")}
                    style={{ padding: "12px 16px", fontWeight: "600", textAlign: "center", cursor: "pointer", width: "90px" }}
                  >
                    <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                      Status
                      <ArrowUpDown style={{ width: "12px", height: "12px", opacity: 0.5 }} />
                    </div>
                  </th>

                  <th style={{ padding: "12px 16px", fontWeight: "600", textAlign: "right", width: "140px" }}>
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {loadingReminders ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "#605e5c" }}>
                      <Loader2
                        style={{
                          width: "20px",
                          height: "20px",
                          animation: "spin 1s linear infinite",
                          display: "inline-block",
                        }}
                      />
                      <div style={{ marginTop: "8px" }}>Loading reminders...</div>
                    </td>
                  </tr>
                ) : paginatedReminders.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "36px", textAlign: "center", color: "#605e5c" }}>
                      No reminders found. Click <strong>&quot;Add Reminder&quot;</strong> to configure a scheduled alert.
                    </td>
                  </tr>
                ) : (
                  paginatedReminders.map((rem) => (
                    <ReminderRow
                      key={rem.id}
                      rem={rem}
                      isSelectedRow={selectedReminderIds.includes(rem.id)}
                      onSelectOne={handleSelectOne}
                      isTriggering={triggeringReminderId === rem.id}
                      onToggleStatus={onToggleStatus}
                      onTriggerNow={onTriggerNow}
                      onOpenEditModal={onOpenEditModal}
                      onDeleteTarget={onDeleteTarget}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          <ToolsPagination
            currentPage={reminderCurrentPage}
            setCurrentPage={setReminderCurrentPage}
            itemsPerPage={reminderItemsPerPage}
            setItemsPerPage={setReminderItemsPerPage}
            totalItems={totalFiltered}
            totalPages={totalPages}
            startIndex={startIdx}
            pageSizeOptions={[5, 10, 20]}
          />
        </div>
      </div>
    </div>
  );
}
