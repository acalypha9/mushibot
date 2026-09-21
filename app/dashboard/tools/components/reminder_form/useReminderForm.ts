"use client";

import { useState, useEffect, useRef } from "react";
import type {
  CronReminderItem,
  ChannelOption,
  ReminderFreqType,
  ReminderTimeMode,
  ReminderVariableItem,
  WaGroupItem,
} from "../../types";
import { buildCronFromManualSettings, parseCronToManualSettings } from "../../utils";
import {
  validateReminderFormInput,
  buildReminderPayload,
  hydrateReminderFormState,
  getDefaultReminderFormState,
  getRecipientDisplayInfo as resolveRecipientDisplayInfo,
  getReminderSubmitUrlAndMethod,
  getWaGroupsFetchUrl,
  type ReminderFormState,
} from "./reminderFormLogic";

export interface UseReminderFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingReminder: CronReminderItem | null;
  availableChannels: ChannelOption[];
  token: string | null;
  onSaved: (savedTitle: string, isEdit: boolean) => void;
}

export function useReminderForm({
  isOpen, onClose, editingReminder, availableChannels, token, onSaved,
}: UseReminderFormProps) {
  const [reminderTitleInput, setReminderTitleInput] = useState("");
  const [reminderVariables, setReminderVariables] = useState<ReminderVariableItem[]>([]);
  const [reminderMessageInput, setReminderMessageInput] = useState("");
  const [reminderChannelTypeInput, setReminderChannelTypeInput] = useState<"WHATSAPP" | "TELEGRAM">("WHATSAPP");
  const [reminderChannelIdInput, setReminderChannelIdInput] = useState("default");
  const [reminderRecipientMode, setReminderRecipientMode] = useState<"specific" | "all">("specific");
  const [reminderAllowPrivate, setReminderAllowPrivate] = useState<boolean>(true);
  const [reminderAllowGroup, setReminderAllowGroup] = useState<boolean>(true);
  const [reminderRecipientList, setReminderRecipientList] = useState<string[]>([]);
  const [reminderBlacklistList, setReminderBlacklistList] = useState<string[]>([]);
  const [editingRecipientIdx, setEditingRecipientIdx] = useState<number | null>(null);
  const [editingBlacklistIdx, setEditingBlacklistIdx] = useState<number | null>(null);
  const [reminderTargetDate, setReminderTargetDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [reminderCountryCode, setReminderCountryCode] = useState<string>("");
  const [reminderFreqType, setReminderFreqType] = useState<ReminderFreqType>("daily");
  const [reminderTimeMode, setReminderTimeMode] = useState<ReminderTimeMode>("exact");
  const [reminderTime, setReminderTime] = useState("");
  const [reminderEndTime, setReminderEndTime] = useState("17:00");
  const [reminderDays, setReminderDays] = useState<number[]>([]);
  const [reminderMinute, setReminderMinute] = useState(0);
  const [reminderIntervalMinutes, setReminderIntervalMinutes] = useState(30);
  const [reminderDayOfMonth, setReminderDayOfMonth] = useState(1);
  const [reminderMinInterval, setReminderMinInterval] = useState(15);
  const [reminderMaxInterval, setReminderMaxInterval] = useState(60);
  const [reminderIntervalUnit, setReminderIntervalUnit] = useState<"minutes" | "hours">("minutes");
  const [reminderUseTimeWindow, setReminderUseTimeWindow] = useState(false);
  const [reminderWindowStartTime, setReminderWindowStartTime] = useState("08:00");
  const [reminderWindowEndTime, setReminderWindowEndTime] = useState("20:00");
  const [reminderTimezoneInput, setReminderTimezoneInput] = useState("");
  const [reminderMaxRunsInput, setReminderMaxRunsInput] = useState<string>("1");
  const [reminderIsActiveInput, setReminderIsActiveInput] = useState(true);
  const [reminderFormError, setReminderFormError] = useState<string | null>(null);
  const [savingReminder, setSavingReminder] = useState(false);

  const [waGroups, setWaGroups] = useState<WaGroupItem[]>([]);
  const [loadingWaGroups, setLoadingWaGroups] = useState(false);
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [showBlGroupPicker, setShowBlGroupPicker] = useState(false);
  const groupPickerRef = useRef<HTMLDivElement>(null);
  const blGroupPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (groupPickerRef.current && !groupPickerRef.current.contains(e.target as Node)) setShowGroupPicker(false);
      if (blGroupPickerRef.current && !blGroupPickerRef.current.contains(e.target as Node)) setShowBlGroupPicker(false);
    }
    if (showGroupPicker || showBlGroupPicker) document.addEventListener("mousedown", handleClickOutside);
    return () => { document.removeEventListener("mousedown", handleClickOutside); };
  }, [showGroupPicker, showBlGroupPicker]);

  const fetchWaGroups = async (force: boolean = false) => {
    try {
      await Promise.resolve();
      setLoadingWaGroups(true);
      const res = await fetch(getWaGroupsFetchUrl(reminderChannelIdInput, force), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch WhatsApp groups: ${res.status}`);
      }
      const data = await res.json();
      if (data.groups && Array.isArray(data.groups)) setWaGroups(data.groups);
    } catch (err) {
      console.error("Failed to fetch WhatsApp groups:", err);
    } finally {
      setLoadingWaGroups(false);
    }
  };

  const applyState = (st: ReminderFormState) => {
    setReminderTitleInput(st.title);
    setReminderVariables(st.variables);
    setReminderMessageInput(st.message);
    setReminderChannelTypeInput(st.channelType);
    setReminderChannelIdInput(st.channelId);
    setReminderRecipientMode(st.recipientMode);
    setReminderAllowPrivate(st.allowPrivate);
    setReminderAllowGroup(st.allowGroup);
    setReminderRecipientList(st.recipientList);
    setReminderBlacklistList(st.blacklistList);
    setEditingRecipientIdx(st.editingRecipientIdx);
    setEditingBlacklistIdx(st.editingBlacklistIdx);
    setReminderTargetDate(st.targetDate);
    setReminderCountryCode(st.countryCode);
    setReminderFreqType(st.freqType);
    setReminderTimeMode(st.timeMode);
    setReminderTime(st.time);
    setReminderEndTime(st.endTime);
    setReminderDays(st.days);
    setReminderMinute(st.minute);
    setReminderIntervalMinutes(st.intervalMinutes);
    setReminderDayOfMonth(st.dayOfMonth);
    setReminderMinInterval(st.minInterval);
    setReminderMaxInterval(st.maxInterval);
    setReminderIntervalUnit(st.intervalUnit);
    setReminderUseTimeWindow(st.useTimeWindow);
    setReminderWindowStartTime(st.windowStartTime);
    setReminderWindowEndTime(st.windowEndTime);
    setReminderTimezoneInput(st.timezone);
    setReminderMaxRunsInput(st.maxRuns);
    setReminderIsActiveInput(st.isActive);
    setReminderFormError(st.formError);
    setShowGroupPicker(false);
    setShowBlGroupPicker(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    queueMicrotask(() => {
      if (editingReminder) {
        applyState(hydrateReminderFormState(editingReminder, parseCronToManualSettings));
      } else {
        applyState(getDefaultReminderFormState(availableChannels));
      }
      void fetchWaGroups();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingReminder]);

  const handleSaveReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    setReminderFormError(null);

    const validationError = validateReminderFormInput({
      title: reminderTitleInput, timezone: reminderTimezoneInput, variables: reminderVariables,
      freqType: reminderFreqType, timeMode: reminderTimeMode, time: reminderTime, endTime: reminderEndTime,
      days: reminderDays, minInterval: reminderMinInterval, maxInterval: reminderMaxInterval,
      intervalUnit: reminderIntervalUnit, useTimeWindow: reminderUseTimeWindow,
      windowStartTime: reminderWindowStartTime, windowEndTime: reminderWindowEndTime,
      message: reminderMessageInput, recipientMode: reminderRecipientMode, recipientList: reminderRecipientList,
    });
    if (validationError) {
      setReminderFormError(validationError);
      return;
    }

    const targetDate = reminderTargetDate.trim() || new Date().toISOString().split("T")[0];
    const generatedCron = buildCronFromManualSettings(
      reminderFreqType, reminderTimeMode, reminderTime, reminderEndTime, reminderDays,
      reminderMinute, reminderIntervalMinutes, reminderDayOfMonth, reminderMinInterval,
      reminderMaxInterval, reminderIntervalUnit, targetDate
    );

    const payload = buildReminderPayload(
      {
        title: reminderTitleInput, message: reminderMessageInput, timezone: reminderTimezoneInput,
        channelType: reminderChannelTypeInput, channelId: reminderChannelIdInput, isActive: reminderIsActiveInput,
        recipientMode: reminderRecipientMode, allowPrivate: reminderAllowPrivate, allowGroup: reminderAllowGroup,
        recipientList: reminderRecipientList, blacklistList: reminderBlacklistList, freqType: reminderFreqType,
        timeMode: reminderTimeMode, time: reminderTime, endTime: reminderEndTime, days: reminderDays,
        minute: reminderMinute, intervalMinutes: reminderIntervalMinutes, dayOfMonth: reminderDayOfMonth,
        minInterval: reminderMinInterval, maxInterval: reminderMaxInterval, intervalUnit: reminderIntervalUnit,
        useTimeWindow: reminderUseTimeWindow, windowStartTime: reminderWindowStartTime,
        windowEndTime: reminderWindowEndTime, targetDate: reminderTargetDate, maxRuns: reminderMaxRunsInput,
        variables: reminderVariables,
      },
      generatedCron
    );

    setSavingReminder(true);
    try {
      const { url, method } = getReminderSubmitUrlAndMethod(editingReminder ? editingReminder.id : null);
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        onSaved(data.title, !!editingReminder);
        onClose();
      } else {
        setReminderFormError(data.detail || data.error || "Failed to save reminder");
      }
    } catch (err: unknown) {
      setReminderFormError(err instanceof Error ? err.message : "Failed to save reminder");
    } finally {
      setSavingReminder(false);
    }
  };

  return {
    reminderTitleInput, setReminderTitleInput,
    reminderVariables, setReminderVariables,
    reminderMessageInput, setReminderMessageInput,
    reminderChannelTypeInput, setReminderChannelTypeInput,
    reminderChannelIdInput, setReminderChannelIdInput,
    reminderRecipientMode, setReminderRecipientMode,
    reminderAllowPrivate, setReminderAllowPrivate,
    reminderAllowGroup, setReminderAllowGroup,
    reminderRecipientList, setReminderRecipientList,
    reminderBlacklistList, setReminderBlacklistList,
    editingRecipientIdx, setEditingRecipientIdx,
    editingBlacklistIdx, setEditingBlacklistIdx,
    reminderTargetDate, setReminderTargetDate,
    reminderCountryCode, setReminderCountryCode,
    reminderFreqType, setReminderFreqType,
    reminderTimeMode, setReminderTimeMode,
    reminderTime, setReminderTime,
    reminderEndTime, setReminderEndTime,
    reminderDays, setReminderDays,
    reminderMinute, setReminderMinute,
    reminderIntervalMinutes, setReminderIntervalMinutes,
    reminderDayOfMonth, setReminderDayOfMonth,
    reminderMinInterval, setReminderMinInterval,
    reminderMaxInterval, setReminderMaxInterval,
    reminderIntervalUnit, setReminderIntervalUnit,
    reminderUseTimeWindow, setReminderUseTimeWindow,
    reminderWindowStartTime, setReminderWindowStartTime,
    reminderWindowEndTime, setReminderWindowEndTime,
    reminderTimezoneInput, setReminderTimezoneInput,
    reminderMaxRunsInput, setReminderMaxRunsInput,
    reminderIsActiveInput, setReminderIsActiveInput,
    reminderFormError, setReminderFormError,
    savingReminder, setSavingReminder,
    waGroups, setWaGroups,
    loadingWaGroups, setLoadingWaGroups,
    showGroupPicker, setShowGroupPicker,
    showBlGroupPicker, setShowBlGroupPicker,
    groupPickerRef, blGroupPickerRef,
    fetchWaGroups,
    getRecipientDisplayInfo: (item: string) => resolveRecipientDisplayInfo(item, waGroups),
    handleSaveReminder,
  };
}
