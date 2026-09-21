import type { ReminderFreqType, ReminderTimeMode, ManualCronSettings } from "./types";
import { formatDateTimeCustom } from "@/lib/utils/formatters";

export function buildCronFromManualSettings(
  freqType: ReminderFreqType,
  timeMode: ReminderTimeMode,
  time: string,
  endTime: string,
  days: number[],
  minute: number,
  intervalMins: number,
  dayOfMonth: number,
  minInterval: number,
  maxInterval: number,
  intervalUnit: "minutes" | "hours" = "minutes",
  targetDate?: string
): string {
  const [h = 0, m = 0] = (time || "09:00").split(":").map((v) => parseInt(v, 10) || 0);

  if (freqType === "once") {
    if (targetDate && targetDate.includes("-")) {
      const [, mo, d] = targetDate.split("-").map(Number);
      if (d && mo) return `${m} ${h} ${d} ${mo} *`;
    }
    return `${m} ${h} * * *`;
  }

  if (freqType === "random_interval") {
    let avg = Math.max(1, Math.round((minInterval + maxInterval) / 2));
    if (intervalUnit === "hours") avg *= 60;
    if (avg >= 60) {
      const hStep = Math.min(23, Math.max(1, Math.round(avg / 60)));
      return `0 */${hStep} * * *`;
    }
    return `*/${avg || 15} * * * *`;
  }

  if (freqType === "daily") {
    if (timeMode === "random_window") {
      const [eh = 17] = (endTime || "17:00").split(":").map((v) => parseInt(v, 10) || 17);
      return eh > h ? `0 ${h}-${eh} * * *` : `0 ${h} * * *`;
    }
    return `${m} ${h} * * *`;
  }

  if (freqType === "weekly") {
    const sortedDays = days.length > 0 ? [...days].sort((a, b) => a - b) : [];
    let dowStr = "*";
    if (sortedDays.length > 0) {
      dowStr = sortedDays.length === 5 && sortedDays.every((d, i) => d === i + 1) ? "1-5" : sortedDays.join(",");
    }
    if (timeMode === "random_window") {
      const [eh = 17] = (endTime || "17:00").split(":").map((v) => parseInt(v, 10) || 17);
      return eh > h ? `0 ${h}-${eh} * * ${dowStr}` : `0 ${h} * * ${dowStr}`;
    }
    return `${m} ${h} * * ${dowStr}`;
  }

  if (freqType === "hourly") return `${minute} * * * *`;
  if (freqType === "interval") return `*/${intervalMins || 30} * * * *`;
  if (freqType === "monthly") return `${m} ${h} ${dayOfMonth || 1} * *`;
  return "0 9 * * *";
}

const createDefaultSettings = (overrides?: Partial<ManualCronSettings>): ManualCronSettings => ({
  freqType: "daily",
  timeMode: "exact",
  time: "",
  endTime: "17:00",
  days: [],
  minute: 0,
  intervalMins: 30,
  dayOfMonth: 1,
  minInterval: 15,
  maxInterval: 60,
  intervalUnit: "minutes",
  useTimeWindow: false,
  windowStartTime: "08:00",
  windowEndTime: "20:00",
  ...overrides,
});

export function parseCronToManualSettings(cronExpr: string, cmetadata?: Record<string, unknown> | null): ManualCronSettings {
  const schedule = cmetadata?._schedule as Record<string, unknown> | undefined;
  if (schedule && typeof schedule === "object") {
    if (schedule?.type === "once" || cmetadata?.is_recurring === false) {
      const timeStr = String(schedule?.target_time || schedule?.time || "09:00");
      const [h = 0, m = 0] = (timeStr.includes(":") ? timeStr : "09:00").split(":").map((v) => parseInt(v, 10) || 0);
      return createDefaultSettings({
        freqType: "once",
        time: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
        minute: m,
        targetDate: typeof schedule?.target_date === "string" ? schedule.target_date : new Date().toISOString().split("T")[0],
      });
    }
    if (schedule.type === "random_interval") {
      return createDefaultSettings({
        freqType: "random_interval",
        time: typeof schedule.start_time === "string" ? schedule.start_time : "09:00",
        endTime: typeof schedule.end_time === "string" ? schedule.end_time : "17:00",
        days: Array.isArray(schedule.days) ? (schedule.days as number[]) : [],
        minInterval: Number(schedule.min_interval) || 15,
        maxInterval: Number(schedule.max_interval) || 60,
        intervalUnit: (schedule.unit as "minutes" | "hours") || "minutes",
        useTimeWindow: Boolean(schedule.use_time_window),
        windowStartTime: typeof schedule.window_start_time === "string" ? schedule.window_start_time : "08:00",
        windowEndTime: typeof schedule.window_end_time === "string" ? schedule.window_end_time : "20:00",
      });
    }
    if (schedule.type === "daily_random" || schedule.type === "weekly_random") {
      return createDefaultSettings({
        freqType: schedule.type === "daily_random" ? "daily" : "weekly",
        timeMode: "random_window",
        time: typeof schedule.start_time === "string" ? schedule.start_time : "09:00",
        endTime: typeof schedule.end_time === "string" ? schedule.end_time : "17:00",
        days: schedule.type === "weekly_random" && Array.isArray(schedule.days) ? (schedule.days as number[]) : [],
      });
    }
  }

  const trimmed = (cronExpr || "").trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length !== 5) return createDefaultSettings();

  const [min, hour, dom, mon, dow] = parts;
  if (min.startsWith("*/") && hour === "*" && dom === "*" && mon === "*" && dow === "*") {
    return createDefaultSettings({ freqType: "interval", time: "09:00", intervalMins: parseInt(min.replace("*/", ""), 10) || 30 });
  }
  if (!isNaN(parseInt(min, 10)) && hour === "*" && dom === "*" && mon === "*" && dow === "*") {
    return createDefaultSettings({ freqType: "hourly", time: "09:00", minute: parseInt(min, 10) });
  }

  const [h = 0, m = 0] = [parseInt(hour, 10) || 0, parseInt(min, 10) || 0];
  const timeFormatted = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

  if (!isNaN(parseInt(dom, 10)) && mon === "*" && dow === "*") {
    return createDefaultSettings({ freqType: "monthly", time: timeFormatted, minute: m, dayOfMonth: parseInt(dom, 10) || 1 });
  }

  if (dow !== "*") {
    const days = dow === "1-5" ? [1, 2, 3, 4, 5] : (dow === "0,6" || dow === "6,0") ? [0, 6] : dow.split(",").map((d) => parseInt(d, 10)).filter((d) => !isNaN(d));
    return createDefaultSettings({ freqType: "weekly", time: timeFormatted, days, minute: m });
  }

  return createDefaultSettings({ freqType: "daily", time: timeFormatted, minute: m });
}

export function formatFriendlySchedule(
  freqType: ReminderFreqType,
  timeMode: ReminderTimeMode,
  time: string,
  endTime: string,
  days: number[],
  minute: number,
  intervalMins: number,
  dayOfMonth: number,
  timezone: string,
  minInterval = 15,
  maxInterval = 60,
  intervalUnit: "minutes" | "hours" = "minutes",
  useTimeWindow = false,
  windowStartTime = "08:00",
  windowEndTime = "20:00"
): string {
  const tzLabel = timezone ? ` - ${timezone}` : "";
  const timeSuffix = time ? ` at ${time}` : "";

  if (freqType === "random_interval") {
    const unitStr = intervalUnit === "hours" ? "hours" : "minutes";
    let windowSuffix = "";
    if (useTimeWindow) {
      const [sh = 8, sm = 0] = (windowStartTime || "08:00").split(":").map(Number);
      const [eh = 20, em = 0] = (windowEndTime || "20:00").split(":").map(Number);
      const windowDuration = eh * 60 + em - (sh * 60 + sm);
      const minIntMins = intervalUnit === "hours" ? minInterval * 60 : minInterval;
      if (windowDuration <= 0) windowSuffix = " (⚠️ Invalid window)";
      else if (windowDuration < minIntMins) windowSuffix = ` (⚠️ Window too short: < ${minInterval} ${unitStr})`;
      else windowSuffix = ` (between ${windowStartTime || "08:00"} and ${windowEndTime || "20:00"})`;
    }
    return `Every random ${minInterval} to ${maxInterval} ${unitStr}${windowSuffix}${tzLabel}`;
  }

  if (freqType === "once") return `One-time${timeSuffix}${tzLabel}`;

  if (freqType === "daily") {
    if (timeMode === "random_window") {
      return `Every day at a random time between ${time || "09:00"} and ${endTime || "17:00"}${tzLabel}`;
    }
    return `Every day${timeSuffix}${tzLabel}`;
  }

  if (freqType === "weekly") {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const sorted = [...days].sort((a, b) => a - b);
    let dayDesc = "Weekly (Select days)";
    if (sorted.length === 5 && sorted.every((d, i) => d === i + 1)) dayDesc = "Every weekday Mon–Fri";
    else if (sorted.length === 2 && sorted.includes(0) && sorted.includes(6)) dayDesc = "Every weekend";
    else if (sorted.length === 7) dayDesc = "Every day";
    else if (sorted.length > 0) dayDesc = `Every ${sorted.map((d) => dayNames[d] || d).join(", ")}`;

    if (timeMode === "random_window") {
      return `${dayDesc} at a random time between ${time || "09:00"} and ${endTime || "17:00"}${tzLabel}`;
    }
    return `${dayDesc}${timeSuffix}${tzLabel}`;
  }

  if (freqType === "hourly") return `Every hour at minute :${String(minute).padStart(2, "0")}${tzLabel}`;
  if (freqType === "interval") return `Every ${intervalMins || 30} minutes${tzLabel}`;
  if (freqType === "monthly") return `Every month on day ${dayOfMonth || 1}${timeSuffix}${tzLabel}`;
  return `Schedule configured${tzLabel}`;
}

export function formatAnyDateInText(text: string): string {
  if (!text) return "";
  return text.replace(/\b(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?(?:[+-]\d{2}:?\d{2}|Z)?\b/g, (_m, y, mo, d, hh, mm, ss) => {
    const formattedDate = `${d.padStart(2, "0")}:${mo.padStart(2, "0")}:${y}`;
    return hh !== undefined && mm !== undefined ? `${formattedDate} ${hh}:${mm}:${ss !== undefined ? ss : "00"}` : formattedDate;
  });
}

export function formatCronHuman(cronExpr: string, cmetadata?: Record<string, unknown> | null): string {
  const schedule = cmetadata?._schedule as Record<string, unknown> | undefined;
  if (schedule?.type === "once" || cmetadata?.is_recurring === false) {
    const timeStr = String(schedule?.target_time || schedule?.time || "");
    const dateStr = String(schedule?.target_date || "");
    if (timeStr && (timeStr.includes("T") || (timeStr.includes("-") && timeStr.length > 10))) {
      return `One-time at ${formatDateTimeCustom(timeStr)}`;
    }
    const cleanTime = timeStr ? (timeStr.split(":").length === 2 ? `${timeStr}:00` : timeStr) : "09:00:00";
    if (dateStr && dateStr.includes("-")) {
      const [y, m, d] = dateStr.split("-");
      const formattedDate = d && m && y ? `${d.padStart(2, "0")}:${m.padStart(2, "0")}:${y}` : dateStr;
      return `One-time at ${formattedDate} ${cleanTime}`;
    }
    return timeStr ? `One-time at ${cleanTime}` : "One-time";
  }

  if (schedule?.type === "random_interval") {
    const unit = schedule.unit === "hours" ? "hours" : "mins";
    const windowStr = schedule.use_time_window ? ` (${(schedule.window_start_time as string) || "08:00"}–${(schedule.window_end_time as string) || "20:00"})` : "";
    return `Random every ${(schedule.min_interval as number) || 15}–${(schedule.max_interval as number) || 60} ${unit}${windowStr}`;
  }
  if (schedule?.type === "daily_random") {
    return `Every day (Random ${(schedule.start_time as string) || "09:00"}–${(schedule.end_time as string) || "17:00"})`;
  }
  if (schedule?.type === "weekly_random") {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dList = ((schedule.days as number[]) || []).map((d: number) => dayNames[d] || d).join(", ");
    return `${dList || "Weekly"} (Random ${(schedule.start_time as string) || "09:00"}–${(schedule.end_time as string) || "17:00"})`;
  }

  if (!cronExpr) return "-";
  const parsed = parseCronToManualSettings(cronExpr, cmetadata);
  return formatFriendlySchedule(
    parsed.freqType,
    parsed.timeMode,
    parsed.time,
    parsed.endTime,
    parsed.days,
    parsed.minute,
    parsed.intervalMins,
    parsed.dayOfMonth,
    "",
    parsed.minInterval,
    parsed.maxInterval,
    parsed.intervalUnit,
    parsed.useTimeWindow,
    parsed.windowStartTime,
    parsed.windowEndTime
  );
}
