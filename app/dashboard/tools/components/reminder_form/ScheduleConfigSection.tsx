"use client";

import React from "react";
import { Input, Select } from "@/components/ui/Input";
import { Clock, Calendar } from "lucide-react";
import type {
  CronReminderItem,
  ReminderFreqType,
  ReminderTimeMode,
} from "../../types";
import {
  formatFriendlySchedule,
  DYNAMIC_TIMEZONE_OPTIONS,
} from "../../utils";
import { ScheduleFrequencyFields } from "./ScheduleFrequencyFields";

export interface ScheduleConfigSectionProps {
  reminderFreqType: ReminderFreqType;
  setReminderFreqType: (val: ReminderFreqType) => void;
  reminderTimezoneInput: string;
  setReminderTimezoneInput: (val: string) => void;
  editingReminder: CronReminderItem | null;
  reminderTargetDate: string;
  setReminderTargetDate: (val: string) => void;
  reminderTime: string;
  setReminderTime: (val: string) => void;
  reminderEndTime: string;
  setReminderEndTime: (val: string) => void;
  reminderTimeMode: ReminderTimeMode;
  setReminderTimeMode: (val: ReminderTimeMode) => void;
  reminderDays: number[];
  setReminderDays: React.Dispatch<React.SetStateAction<number[]>>;
  reminderMinInterval: number;
  setReminderMinInterval: (val: number) => void;
  reminderMaxInterval: number;
  setReminderMaxInterval: (val: number) => void;
  reminderIntervalUnit: "minutes" | "hours";
  setReminderIntervalUnit: (val: "minutes" | "hours") => void;
  reminderUseTimeWindow: boolean;
  setReminderUseTimeWindow: (val: boolean) => void;
  reminderWindowStartTime: string;
  setReminderWindowStartTime: (val: string) => void;
  reminderWindowEndTime: string;
  setReminderWindowEndTime: (val: string) => void;
  reminderMinute: number;
  setReminderMinute: (val: number) => void;
  reminderIntervalMinutes: number;
  setReminderIntervalMinutes: (val: number) => void;
  reminderDayOfMonth: number;
  setReminderDayOfMonth: (val: number) => void;
  reminderMaxRunsInput: string;
  setReminderMaxRunsInput: (val: string) => void;
}

export function ScheduleConfigSection(props: ScheduleConfigSectionProps) {
  const {
    reminderFreqType, setReminderFreqType,
    reminderTimezoneInput, setReminderTimezoneInput,
    editingReminder,
    reminderTargetDate, setReminderTargetDate,
    reminderTime, setReminderTime,
    reminderEndTime, setReminderEndTime,
    reminderTimeMode, setReminderTimeMode,
    reminderDays, setReminderDays,
    reminderMinInterval, setReminderMinInterval,
    reminderMaxInterval, setReminderMaxInterval,
    reminderIntervalUnit, setReminderIntervalUnit,
    reminderUseTimeWindow, setReminderUseTimeWindow,
    reminderWindowStartTime, setReminderWindowStartTime,
    reminderWindowEndTime, setReminderWindowEndTime,
    reminderMinute, setReminderMinute,
    reminderIntervalMinutes, setReminderIntervalMinutes,
    reminderDayOfMonth, setReminderDayOfMonth,
    reminderMaxRunsInput, setReminderMaxRunsInput,
  } = props;

  return (
    <div style={{
      padding: "16px", borderRadius: "8px", background: "#faf9f8",
      border: "1px solid #edebe9", display: "flex", flexDirection: "column", gap: "14px",
    }}>
      <div style={{ fontSize: "13px", fontWeight: "700", color: "#323130", display: "flex", alignItems: "center", gap: "8px" }}>
        <Clock style={{ width: "16px", height: "16px", color: "#742774" }} />
        <span>Schedule Settings</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#605e5c", marginBottom: "4px" }}>
            Repeat Frequency
          </label>
          <Select
            value={reminderFreqType}
            onChange={(e) => {
              const next = e.target.value as ReminderFreqType;
              setReminderFreqType(next);
              if (next === "weekly" && !editingReminder) setReminderDays([]);
            }}
          >
            <option value="once">One-time</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="hourly">Hourly</option>
            <option value="interval">Minute Interval (Fixed)</option>
            <option value="random_interval">Random Interval (Between)</option>
            <option value="monthly">Monthly</option>
          </Select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#605e5c", marginBottom: "4px" }}>
            Timezone <span style={{ color: "#a4262c" }}>*</span>
          </label>
          <Select
            value={reminderTimezoneInput}
            onChange={(e) => setReminderTimezoneInput(e.target.value)}
            style={{ color: reminderTimezoneInput ? "#323130" : "#605e5c" }}
          >
            <option value="" disabled>Choose</option>
            {DYNAMIC_TIMEZONE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        </div>
      </div>

      <ScheduleFrequencyFields
        reminderFreqType={reminderFreqType}
        reminderTargetDate={reminderTargetDate}
        setReminderTargetDate={setReminderTargetDate}
        reminderTime={reminderTime}
        setReminderTime={setReminderTime}
        reminderEndTime={reminderEndTime}
        setReminderEndTime={setReminderEndTime}
        reminderTimeMode={reminderTimeMode}
        setReminderTimeMode={setReminderTimeMode}
        reminderDays={reminderDays}
        setReminderDays={setReminderDays}
        reminderMinInterval={reminderMinInterval}
        setReminderMinInterval={setReminderMinInterval}
        reminderMaxInterval={reminderMaxInterval}
        setReminderMaxInterval={setReminderMaxInterval}
        reminderIntervalUnit={reminderIntervalUnit}
        setReminderIntervalUnit={setReminderIntervalUnit}
        reminderUseTimeWindow={reminderUseTimeWindow}
        setReminderUseTimeWindow={setReminderUseTimeWindow}
        reminderWindowStartTime={reminderWindowStartTime}
        setReminderWindowStartTime={setReminderWindowStartTime}
        reminderWindowEndTime={reminderWindowEndTime}
        setReminderWindowEndTime={setReminderWindowEndTime}
        reminderMinute={reminderMinute}
        setReminderMinute={setReminderMinute}
        reminderIntervalMinutes={reminderIntervalMinutes}
        setReminderIntervalMinutes={setReminderIntervalMinutes}
        reminderDayOfMonth={reminderDayOfMonth}
        setReminderDayOfMonth={setReminderDayOfMonth}
      />

      <div style={{ borderTop: "1px dashed #e1dfdd", paddingTop: "12px" }}>
        <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#605e5c", marginBottom: "4px" }}>Message Limit</label>
        <Input
          type="number" min={1} value={reminderMaxRunsInput}
          onChange={(e) => setReminderMaxRunsInput(e.target.value)}
          onBlur={() => {
            const num = parseInt(reminderMaxRunsInput, 10);
            if (isNaN(num) || num < 1) setReminderMaxRunsInput("1");
          }}
          placeholder="1"
        />
        <div style={{ fontSize: "11px", color: "#8a8886", marginTop: "4px" }}>Messages to send per schedule.</div>
      </div>

      <div style={{
        padding: "10px 14px", borderRadius: "6px", background: "#ffffff",
        border: "1px solid #e1dfdd", fontSize: "13px", color: "#742774",
        fontWeight: "600", display: "flex", alignItems: "center", gap: "8px",
      }}>
        <Calendar style={{ width: "15px", height: "15px", flexShrink: 0 }} />
        <span>
          {formatFriendlySchedule(
            reminderFreqType, reminderTimeMode, reminderTime, reminderEndTime,
            reminderDays, reminderMinute, reminderIntervalMinutes, reminderDayOfMonth,
            reminderTimezoneInput, reminderMinInterval, reminderMaxInterval,
            reminderIntervalUnit, reminderUseTimeWindow, reminderWindowStartTime, reminderWindowEndTime
          )}
        </span>
      </div>
    </div>
  );
}
