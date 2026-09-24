import type {
  CronReminderItem,
  ChannelOption,
  ManualCronSettings,
  ReminderFreqType,
  ReminderTimeMode,
  ReminderVariableItem,
  ReminderVariableType,
  WaGroupItem,
} from "../../types";
import type { ReminderValidationInput, ReminderFormState, ReminderPayloadInput } from "./types";
import { combinePhoneNumber } from "@/lib/countryCodes";

export type { ReminderValidationInput, ReminderFormState, ReminderPayloadInput };

export function validateReminderFormInput(input: ReminderValidationInput): string | null {
  if (!input.title.trim()) return "Please enter a reminder title.";
  if (!input.timezone.trim()) return "Please select a timezone.";
  for (let i = 0; i < input.variables.length; i++) {
    const v = input.variables[i];
    if (!v.key.trim() || !v.value.trim()) return `Please fill in both key and value for variable #${i + 1}.`;
  }
  if (input.freqType === "once" && !input.time.trim()) {
    return "Please set the execution time for the one-time reminder.";
  }
  if (input.freqType === "random_interval") {
    if (!input.minInterval || input.minInterval < 1) return "Please enter a valid minimum interval (at least 1).";
    if (!input.maxInterval || input.maxInterval < input.minInterval) {
      return "Maximum interval must be greater than or equal to minimum interval.";
    }
    if (input.useTimeWindow) {
      if (!input.windowStartTime.trim() || !input.windowEndTime.trim()) {
        return "Please set both the start time and end time for the active time window.";
      }
      const [sh = 0, sm = 0] = input.windowStartTime.split(":").map(Number);
      const [eh = 0, em = 0] = input.windowEndTime.split(":").map(Number);
      const sMins = sh * 60 + sm, eMins = eh * 60 + em;
      if (eMins <= sMins) return "Active window End time must be after Start time.";
      const minIntervalMins = input.intervalUnit === "hours" ? input.minInterval * 60 : input.minInterval;
      const windowDurationMins = eMins - sMins;
      if (windowDurationMins < minIntervalMins) {
        return `Active window (${windowDurationMins}m) cannot be shorter than min interval (${minIntervalMins}m).`;
      }
    }
  }
  const isRecurringFixed = input.freqType === "daily" || input.freqType === "weekly";
  if (isRecurringFixed && input.timeMode === "exact" && !input.time.trim()) return "Please set the execution time.";
  if (isRecurringFixed && input.timeMode === "random_window") {
    if (!input.time.trim() || !input.endTime.trim()) return "Please set both start and end time for the random interval.";
    const [sh = 0, sm = 0] = input.time.split(":").map(Number);
    const [eh = 0, em = 0] = input.endTime.split(":").map(Number);
    if (eh * 60 + em <= sh * 60 + sm) return "Random interval End time must be after Start time.";
  }
  if (input.freqType === "monthly" && !input.time.trim()) return "Please set the execution time.";
  if (input.freqType === "weekly" && input.days.length === 0) return "Please select at least one day for the weekly schedule.";
  if (!input.message.trim()) return "Please enter the reminder message content.";

  const cleanRecipients = input.recipientList.map((r) => r.trim()).filter(Boolean);
  if (input.recipientMode === "specific" && cleanRecipients.length === 0) {
    return "Please add at least one recipient or click 'Set All'.";
  }
  return null;
}

export function buildTargetRecipientsPayload(
  mode: "specific" | "all", allowPrivate: boolean, allowGroup: boolean,
  recipientList: string[], blacklistList: string[]
): string {
  const cleanRecipients = recipientList.map((r) => r.trim()).filter(Boolean);
  const cleanBlacklist = blacklistList.map((b) => b.trim()).filter(Boolean);
  if (mode === "all") {
    const filterTag = (allowPrivate && !allowGroup) ? " (Private only)" : (!allowPrivate && allowGroup) ? " (Groups only)" : "";
    const blTag = cleanBlacklist.length > 0 ? ` (exclude: ${cleanBlacklist.join(", ")})` : "";
    return `ALL${filterTag}${blTag}`;
  }
  return cleanRecipients.join(", ");
}

export function sanitizeReminderVariables(variables: ReminderVariableItem[]) {
  const reserved = new Set(["_schedule", "_variables", "_recipients", "is_recurring", "title", "max_runs"]);
  const _variables = variables.map((v) => ({
    id: v.id, key: v.key.trim().replace(/^\{+|\}+$/g, ""), type: v.type || "text", value: v.value.trim(),
  }));
  const customVariables: Record<string, { type: ReminderVariableType; value: string }> = {};
  for (const item of variables) {
    const k = item.key.trim().replace(/^\{+|\}+$/g, "");
    if (k && !reserved.has(k)) {
      customVariables[k] = { type: item.type || "text", value: item.value.trim() };
    }
  }
  return { _variables, customVariables };
}

export function buildReminderScheduleMetadata(
  state: {
    freqType: ReminderFreqType; timeMode: ReminderTimeMode; time: string; endTime: string;
    days: number[]; minute: number; intervalMinutes: number; dayOfMonth: number;
    minInterval: number; maxInterval: number; intervalUnit: "minutes" | "hours";
    useTimeWindow: boolean; windowStartTime: string; windowEndTime: string;
  },
  isOnce: boolean, targetDate: string, parsedMaxRuns: number
) {
  const scheduleType = isOnce ? "once"
    : state.freqType === "random_interval" ? "random_interval"
    : state.freqType === "daily" && state.timeMode === "random_window" ? "daily_random"
    : state.freqType === "weekly" && state.timeMode === "random_window" ? "weekly_random"
    : state.freqType;

  return {
    type: scheduleType, target_date: isOnce ? targetDate : undefined,
    target_time: isOnce ? state.time || "09:00" : undefined, time_mode: state.timeMode,
    start_time: state.time || "09:00", end_time: state.endTime || "17:00", days: state.days,
    minute: state.minute, interval_mins: state.intervalMinutes, day_of_month: state.dayOfMonth,
    min_interval: state.minInterval, max_interval: state.maxInterval, unit: state.intervalUnit,
    use_time_window: state.useTimeWindow, window_start_time: state.windowStartTime,
    window_end_time: state.windowEndTime, max_runs: parsedMaxRuns,
  };
}

export function buildReminderCustomMetadata(
  state: ReminderPayloadInput,
  cleanRecipients: string[],
  cleanBlacklist: string[],
  groupSubjects?: Record<string, string>
): Record<string, unknown> {
  const isOnce = state.freqType === "once";
  const targetDate = state.targetDate.trim() || new Date().toISOString().split("T")[0];
  const parsedMaxRuns = isOnce ? 1 : Math.max(1, parseInt(state.maxRuns.trim(), 10) || 1);
  const { _variables, customVariables } = sanitizeReminderVariables(state.variables);

  const recipientsMeta: Record<string, unknown> = {
    mode: state.recipientMode,
    allow_private: state.allowPrivate,
    allow_group: state.allowGroup,
    recipients: cleanRecipients,
    blacklist: cleanBlacklist,
  };

  if (groupSubjects && Object.keys(groupSubjects).length > 0) {
    recipientsMeta.group_subjects = groupSubjects;
  }

  return {
    is_recurring: !isOnce,
    _variables,
    _recipients: recipientsMeta,
    _schedule: buildReminderScheduleMetadata(state, isOnce, targetDate, parsedMaxRuns),
    max_runs: parsedMaxRuns,
    ...customVariables,
  };
}

export function normalizeRecipientId(
  input: string,
  channelType: "WHATSAPP" | "TELEGRAM",
  waGroups: WaGroupItem[] = [],
  countryCode: string = ""
): string {
  const trimmed = typeof input === "string" ? input.trim() : "";
  if (!trimmed) return "";

  if (channelType === "WHATSAPP") {
    const groups = Array.isArray(waGroups) ? waGroups : [];
    const lower = trimmed.toLowerCase();
    const cleanLower = lower.replace(/@g\.us$/, "");
    const normalizedSearch = lower.replace(/\s+/g, " ");

    const matchedGroup = groups.find((g) => {
      if (!g) return false;
      const gSubj = g.subject ? g.subject.trim().toLowerCase().replace(/\s+/g, " ") : "";
      const gId = g.id ? g.id.toLowerCase() : "";
      const gCleanId = gId.replace(/@g\.us$/, "");
      return (
        gSubj === normalizedSearch ||
        gId === lower ||
        gCleanId === cleanLower
      );
    });
    if (matchedGroup?.id) {
      return matchedGroup.id.endsWith("@g.us") ? matchedGroup.id : `${matchedGroup.id}@g.us`;
    }

    if (trimmed.endsWith("@g.us")) {
      return trimmed;
    }

    const isModernGroup = /^120363\d{10,20}$/.test(trimmed);
    const isLegacyGroup = /^\d{8,15}-\d{8,12}$/.test(trimmed);
    if (isModernGroup || isLegacyGroup) {
      return `${trimmed}@g.us`;
    }

    if (/[a-zA-Z]/.test(trimmed)) {
      return trimmed;
    }

    const digitsOnly = trimmed.replace(/\D/g, "");
    if (digitsOnly.length > 0) {
      return combinePhoneNumber(trimmed, countryCode);
    }

    return trimmed;
  }

  return trimmed;
}

export const normalizeRecipientInput = normalizeRecipientId;

export function buildReminderPayload(
  state: ReminderPayloadInput,
  generatedCron: string,
  waGroups: WaGroupItem[] = []
) {
  const groups = Array.isArray(waGroups) ? waGroups : [];
  const cleanRecipients = state.recipientList
    .map((r) => normalizeRecipientId(r, state.channelType, groups))
    .map((r) => r.trim())
    .filter(Boolean);
  const cleanBlacklist = state.blacklistList
    .map((b) => normalizeRecipientId(b, state.channelType, groups))
    .map((b) => b.trim())
    .filter(Boolean);

  const groupSubjects: Record<string, string> = { ...(state.groupSubjects || {}) };
  for (const g of groups) {
    if (!g?.id || !g?.subject) continue;
    const canonicalJid = g.id.endsWith("@g.us") ? g.id : `${g.id}@g.us`;
    const subjNorm = g.subject.trim().toLowerCase().replace(/\s+/g, " ");

    const matchesRecipient =
      cleanRecipients.includes(canonicalJid) ||
      state.recipientList.some((r) => {
        const rNorm = r.trim().toLowerCase().replace(/\s+/g, " ");
        return rNorm === subjNorm || r.trim().toLowerCase() === g.id.toLowerCase();
      });
    const matchesBlacklist =
      cleanBlacklist.includes(canonicalJid) ||
      state.blacklistList.some((b) => {
        const bNorm = b.trim().toLowerCase().replace(/\s+/g, " ");
        return bNorm === subjNorm || b.trim().toLowerCase() === g.id.toLowerCase();
      });

    if (matchesRecipient || matchesBlacklist) {
      groupSubjects[canonicalJid] = g.subject.trim();
    }
  }

  const customMeta = buildReminderCustomMetadata(state, cleanRecipients, cleanBlacklist, groupSubjects);
  const targetRecipients = buildTargetRecipientsPayload(
    state.recipientMode, state.allowPrivate, state.allowGroup, cleanRecipients, cleanBlacklist
  );

  return {
    title: state.title.trim(), description: (customMeta.description as string) || null,
    message: state.message.trim(), cron_expression: generatedCron, timezone: state.timezone || "Asia/Jakarta",
    channel_type: state.channelType, channel_id: state.channelId || "default",
    target_recipients: targetRecipients, is_active: state.isActive, cmetadata: customMeta,
  };
}

export function hydrateReminderFormState(
  rem: CronReminderItem,
  parseCron?: (cronExpr: string, cmetadata?: Record<string, unknown> | null) => ManualCronSettings | null
): ReminderFormState {
  let variables: ReminderVariableItem[] = [];
  const meta = (rem.cmetadata && typeof rem.cmetadata === "object") ? (rem.cmetadata as Record<string, unknown>) : null;
  if (meta) {
    const rawVars = meta._variables;
    if (Array.isArray(rawVars)) {
      variables = (rawVars as ReminderVariableItem[]).filter(
        (v) => v?.key && v.key !== "is_recurring" && v.key !== "title"
      );
    } else {
      Object.entries(meta).forEach(([k, v]) => {
        if (k.startsWith("_") || k === "is_recurring" || k === "title" || k === "max_runs") return;
        const isObj = typeof v === "object" && v !== null && "type" in (v as Record<string, unknown>);
        const objVal = isObj ? (v as { type: ReminderVariableType; value?: unknown }) : null;
        variables.push({
          id: `var_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          key: k, type: objVal?.type || "text", value: String(objVal ? objVal.value ?? "" : v ?? ""),
        });
      });
    }
  }

  const recMeta = meta?._recipients as {
    mode?: string; allow_private?: boolean; allow_group?: boolean; recipients?: string[]; blacklist?: string[];
    group_subjects?: Record<string, string>;
  } | undefined;
  const isAll = recMeta?.mode === "all" || rem.target_recipients === "ALL" || rem.target_recipients?.startsWith("ALL");

  let recipientMode: "specific" | "all" = "specific";
  let allowPrivate = true, allowGroup = true;
  let recipientList: string[] = [], blacklistList: string[] = [];

  if (isAll) {
    recipientMode = "all";
    blacklistList = Array.isArray(recMeta?.blacklist) ? recMeta.blacklist : [];
    if (typeof recMeta?.allow_private === "boolean") allowPrivate = recMeta.allow_private;
    else if (rem.target_recipients?.includes("Private only") || rem.target_recipients?.includes("ALL:PRIVATE")) allowPrivate = true;
    else if (rem.target_recipients?.includes("Groups only") || rem.target_recipients?.includes("ALL:GROUP")) allowPrivate = false;

    if (typeof recMeta?.allow_group === "boolean") allowGroup = recMeta.allow_group;
    else if (rem.target_recipients?.includes("Groups only") || rem.target_recipients?.includes("ALL:GROUP")) allowGroup = true;
    else if (rem.target_recipients?.includes("Private only") || rem.target_recipients?.includes("ALL:PRIVATE")) allowGroup = false;
  } else {
    if (Array.isArray(recMeta?.recipients) && recMeta.recipients.length > 0) recipientList = recMeta.recipients;
    else if (rem.target_recipients) recipientList = rem.target_recipients.split(",").map((s) => s.trim()).filter(Boolean);
  }

  const schedMeta = meta?._schedule as { max_runs?: number | string } | undefined;
  const maxRunsVal = schedMeta?.max_runs ?? meta?.max_runs;
  const maxRuns = String(Math.max(1, parseInt(String(maxRunsVal || 1), 10) || 1));
  const parsedCron = parseCron ? parseCron(rem.cron_expression, rem.cmetadata) : null;
  const groupSubjects = (recMeta?.group_subjects || (meta?.group_subjects as Record<string, string> | undefined)) || {};

  return {
    title: rem.title, variables, message: rem.message,
    channelType: rem.channel_type === "TELEGRAM" ? "TELEGRAM" : "WHATSAPP",
    channelId: rem.channel_id || "default", recipientMode, allowPrivate, allowGroup,
    recipientList, blacklistList, editingRecipientIdx: null, editingBlacklistIdx: null,
    targetDate: parsedCron?.targetDate || new Date().toISOString().split("T")[0],
    countryCode: "", freqType: parsedCron?.freqType || "daily", timeMode: parsedCron?.timeMode || "exact",
    time: parsedCron?.time || "", endTime: parsedCron?.endTime || "17:00", days: parsedCron?.days || [],
    minute: parsedCron?.minute || 0, intervalMinutes: parsedCron?.intervalMins || 30,
    dayOfMonth: parsedCron?.dayOfMonth || 1, minInterval: parsedCron?.minInterval || 15,
    maxInterval: parsedCron?.maxInterval || 60, intervalUnit: parsedCron?.intervalUnit || "minutes",
    useTimeWindow: Boolean(parsedCron?.useTimeWindow), windowStartTime: parsedCron?.windowStartTime || "08:00",
    windowEndTime: parsedCron?.windowEndTime || "20:00", timezone: rem.timezone || "Asia/Jakarta",
    maxRuns, isActive: rem.is_active, formError: null, groupSubjects,
  };
}

export function getDefaultReminderFormState(availableChannels: ChannelOption[]): ReminderFormState {
  const matching = availableChannels.filter((c) => c.type === "WHATSAPP");
  return {
    title: "", variables: [], message: "", channelType: "WHATSAPP",
    channelId: matching.length > 0 ? matching[0].id : "default",
    recipientMode: "specific", allowPrivate: true, allowGroup: true, recipientList: [], blacklistList: [],
    editingRecipientIdx: null, editingBlacklistIdx: null, targetDate: new Date().toISOString().split("T")[0],
    countryCode: "", freqType: "daily", timeMode: "exact", time: "", endTime: "17:00", days: [], minute: 0,
    intervalMinutes: 30, dayOfMonth: 1, minInterval: 15, maxInterval: 60, intervalUnit: "minutes",
    useTimeWindow: false, windowStartTime: "08:00", windowEndTime: "20:00", timezone: "Asia/Jakarta",
    maxRuns: "1", isActive: true, formError: null, groupSubjects: {},
  };
}

export function getRecipientDisplayInfo(
  recItem: string,
  waGroups: WaGroupItem[] = [],
  groupSubjects?: Record<string, string>
) {
  const item = recItem.trim();
  if (!item) return { title: "", subtitle: null, isGroup: false };
  const groups = Array.isArray(waGroups) ? waGroups : [];
  const lower = item.toLowerCase();
  const normalizedSearch = lower.replace(/\s+/g, " ");

  const matched = groups.find((g) => {
    if (!g) return false;
    const gSubj = g.subject ? g.subject.trim().toLowerCase().replace(/\s+/g, " ") : "";
    const gId = g.id ? g.id.toLowerCase() : "";
    const gCleanId = gId.replace(/@g\.us$/, "");
    return (
      gSubj === normalizedSearch ||
      gId === lower ||
      gCleanId === lower.replace(/@g\.us$/, "")
    );
  });
  if (matched) return { title: matched.subject, subtitle: matched.id, isGroup: true };

  if (groupSubjects) {
    const canonicalJid = item.endsWith("@g.us") ? item : `${item}@g.us`;
    if (groupSubjects[item]) {
      return { title: groupSubjects[item], subtitle: canonicalJid, isGroup: true };
    }
    if (groupSubjects[canonicalJid]) {
      return { title: groupSubjects[canonicalJid], subtitle: canonicalJid, isGroup: true };
    }
  }

  if (item.includes("@g.us") || item.startsWith("120363") || /^\d{15,25}$/.test(item.replace(/[^\d]/g, ""))) {
    return { title: "WhatsApp Group", subtitle: item.endsWith("@g.us") ? item : `${item}@g.us`, isGroup: true };
  }
  return { title: item, subtitle: null, isGroup: false };
}

export function getReminderSubmitUrlAndMethod(editingReminderId: string | null) {
  return {
    url: editingReminderId ? `/api/reminders/${editingReminderId}` : "/api/reminders",
    method: (editingReminderId ? "PUT" : "POST") as "PUT" | "POST",
  };
}

export function getWaGroupsFetchUrl(channelId: string, force: boolean = false) {
  return `/api/channel/whatsapp?action=groups&channel_id=${channelId}${force ? "&refresh=true" : ""}`;
}
