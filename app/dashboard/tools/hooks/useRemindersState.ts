"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { CronReminderItem, ChannelOption } from "../types";
import {
  getRemindersChannelsEndpoint,
  getReminderToggleEndpoint,
  getReminderDeleteEndpoint,
  unpackChannelsResponse,
} from "../api_contracts";

export interface ReminderTestResult {
  success?: boolean;
  message?: string;
  details?: unknown;
  error?: string;
}

interface UseRemindersStateOptions {
  onError?: (msg: string) => void;
  onSuccess?: (msg: string) => void;
}

export function useRemindersState(
  token: string | null,
  options?: UseRemindersStateOptions
) {
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const [reminders, setReminders] = useState<CronReminderItem[]>([]);
  const [loadingReminders, setLoadingReminders] = useState(true);
  const [availableChannels, setAvailableChannels] = useState<ChannelOption[]>([]);
  const [reminderChannelFilter, setReminderChannelFilter] = useState("all");
  const [reminderStatusFilter, setReminderStatusFilter] = useState("all");
  const [reminderSearchInput, setReminderSearchInput] = useState("");
  const [reminderSearchTerm, setReminderSearchTerm] = useState("");
  const [reminderSortColumn, setReminderSortColumn] = useState<
    "created_at" | "title" | "channel" | "next_run" | "status"
  >("created_at");
  const [reminderSortDirection, setReminderSortDirection] = useState<"asc" | "desc">("desc");
  const [reminderCurrentPage, setReminderCurrentPage] = useState<number>(1);
  const [reminderItemsPerPage, setReminderItemsPerPage] = useState<number>(10);

  const [showReminderModal, setShowReminderModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<CronReminderItem | null>(null);
  const [deleteTargetReminder, setDeleteTargetReminder] = useState<CronReminderItem | null>(null);
  const [deletingReminder, setDeletingReminder] = useState(false);

  // Checkbox selection and bulk delete state
  const [selectedReminderIds, setSelectedReminderIds] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  const [triggeringReminderId, setTriggeringReminderId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<ReminderTestResult | null>(null);
  const [showTestResultModal, setShowTestResultModal] = useState(false);
  const [testReminderTargetTitle, setTestReminderTargetTitle] = useState("");

  const fetchChannels = useCallback(async () => {
    if (!token) return;
    try {
      const ep = getRemindersChannelsEndpoint();
      const res = await fetch(ep.url, {
        method: ep.method,
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setAvailableChannels(unpackChannelsResponse(data));
      }
    } catch (err) {
      console.error("Failed to fetch channels:", err);
    }
  }, [token]);

  const fetchReminders = useCallback(
    async (silent = false) => {
      if (!token) return;
      if (!silent) setLoadingReminders(true);
      try {
        const res = await fetch("/api/reminders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || data.error || "Failed to fetch reminders");
        setReminders(Array.isArray(data) ? data : []);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error loading reminders";
        console.error(msg, err);
        if (!silent) optionsRef.current?.onError?.(msg);
      } finally {
        if (!silent) setLoadingReminders(false);
      }
    },
    [token]
  );

  const handleToggleReminderStatus = useCallback(
    async (rem: CronReminderItem, e?: React.SyntheticEvent) => {
      if (e) e.stopPropagation();
      if (!token) return;

      const newStatus = !rem.is_active;
      setReminders((prev) =>
        prev.map((r) => {
          if (r.id === rem.id) return { ...r, is_active: newStatus };
          return r;
        })
      );

      try {
        const ep = getReminderToggleEndpoint(rem.id);
        const res = await fetch(ep.url, {
          method: ep.method,
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed to toggle reminder status");
        optionsRef.current?.onSuccess?.(`Reminder "${rem.title}" ${newStatus ? "activated" : "deactivated"}.`);
        fetchReminders(true);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to toggle reminder status";
        console.error(msg, err);
        optionsRef.current?.onError?.(msg);
        fetchReminders(true);
      }
    },
    [token, fetchReminders]
  );

  const handleTriggerReminderNow = useCallback(
    async (rem: CronReminderItem, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      if (!token) return;

      setTriggeringReminderId(rem.id);
      setTestReminderTargetTitle(rem.title);
      try {
        const res = await fetch(`/api/reminders/${rem.id}/trigger`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setTestResult(data);
        setShowTestResultModal(true);
        fetchReminders(true);
      } catch (err) {
        setTestResult({
          success: false,
          error: err instanceof Error ? err.message : "Failed to execute manual trigger",
        });
        setShowTestResultModal(true);
      } finally {
        setTriggeringReminderId(null);
      }
    },
    [token, fetchReminders]
  );

  const handleDeleteReminder = useCallback(async () => {
    if (!deleteTargetReminder || !token) return;
    setDeletingReminder(true);
    try {
      const ep = getReminderDeleteEndpoint(deleteTargetReminder.id);
      const res = await fetch(ep.url, {
        method: ep.method,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status !== 204 && !res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to delete reminder");
      }
      optionsRef.current?.onSuccess?.(`Reminder "${deleteTargetReminder.title}" deleted.`);
      setSelectedReminderIds((prev) => prev.filter((id) => id !== deleteTargetReminder.id));
      setDeleteTargetReminder(null);
      fetchReminders(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete reminder";
      console.error(msg, err);
      optionsRef.current?.onError?.(msg);
    } finally {
      setDeletingReminder(false);
    }
  }, [deleteTargetReminder, token, fetchReminders]);

  const handleBulkDeleteReminders = useCallback(async () => {
    if (selectedReminderIds.length === 0 || !token) return;
    setDeletingReminder(true);
    try {
      await Promise.all(
        selectedReminderIds.map((id) => {
          const ep = getReminderDeleteEndpoint(id);
          return fetch(ep.url, {
            method: ep.method,
            headers: { Authorization: `Bearer ${token}` },
          });
        })
      );
      optionsRef.current?.onSuccess?.(`Deleted ${selectedReminderIds.length} scheduled reminder(s).`);
      setSelectedReminderIds([]);
      setShowBulkDeleteModal(false);
      fetchReminders(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete selected reminders";
      console.error(msg, err);
      optionsRef.current?.onError?.(msg);
    } finally {
      setDeletingReminder(false);
    }
  }, [selectedReminderIds, token, fetchReminders]);

  return {
    reminders,
    loadingReminders,
    availableChannels,
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
    showReminderModal,
    setShowReminderModal,
    editingReminder,
    setEditingReminder,
    deleteTargetReminder,
    setDeleteTargetReminder,
    deletingReminder,
    selectedReminderIds,
    setSelectedReminderIds,
    showBulkDeleteModal,
    setShowBulkDeleteModal,
    triggeringReminderId,
    testResult,
    setTestResult,
    testReminderTargetTitle,
    showTestResultModal,
    setShowTestResultModal,
    fetchChannels,
    fetchReminders,
    handleToggleReminderStatus,
    handleTriggerReminderNow,
    handleDeleteReminder,
    handleBulkDeleteReminders,
  };
}
