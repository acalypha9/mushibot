"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import type { ReminderFreqType, ReminderTimeMode } from "../../types";
import { TimePicker, RandomRangePicker } from "./ScheduleTimePickers";

export interface ScheduleFrequencyFieldsProps {
  reminderFreqType: ReminderFreqType;
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
}

export function ScheduleFrequencyFields(props: ScheduleFrequencyFieldsProps) {
  const {
    reminderFreqType, reminderTargetDate, setReminderTargetDate,
    reminderTime, setReminderTime, reminderEndTime, setReminderEndTime,
    reminderTimeMode, setReminderTimeMode, reminderDays, setReminderDays,
    reminderMinInterval, setReminderMinInterval, reminderMaxInterval, setReminderMaxInterval,
    reminderIntervalUnit, setReminderIntervalUnit, reminderUseTimeWindow, setReminderUseTimeWindow,
    reminderWindowStartTime, setReminderWindowStartTime, reminderWindowEndTime, setReminderWindowEndTime,
    reminderMinute, setReminderMinute, reminderIntervalMinutes, setReminderIntervalMinutes,
    reminderDayOfMonth, setReminderDayOfMonth,
  } = props;

  const toggleDay = (dId: number) => {
    setReminderDays((prev) => (prev.includes(dId) ? prev.filter((x) => x !== dId) : [...prev, dId]));
  };

  const toggleRandomWindow = () => {
    if (reminderTimeMode === "random_window") {
      setReminderTimeMode("exact");
    } else {
      setReminderTimeMode("random_window");
      if (!reminderTime) setReminderTime("09:00");
      if (!reminderEndTime) setReminderEndTime("17:00");
    }
  };

  return (
    <>
      {reminderFreqType === "once" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#605e5c", marginBottom: "4px" }}>
              Target Date <span style={{ color: "#a4262c" }}>*</span>
            </label>
            <Input type="date" value={reminderTargetDate || new Date().toISOString().split("T")[0]} onChange={(e) => setReminderTargetDate(e.target.value)} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#605e5c", marginBottom: "4px" }}>
              Execution Time <span style={{ color: "#a4262c" }}>*</span>
            </label>
            <TimePicker value={reminderTime} onChange={setReminderTime} />
          </div>
        </div>
      )}

      {reminderFreqType === "daily" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label style={{ fontSize: "12px", fontWeight: "600", color: "#605e5c" }}>
              {reminderTimeMode === "random_window" ? "Random Interval Between (Start & End Time)" : "Execution Time"}
            </label>
            <Button type="button" variant={reminderTimeMode === "random_window" ? "primary" : "outline"} size="sm" onClick={toggleRandomWindow}>
              Random in Interval
            </Button>
          </div>
          {reminderTimeMode === "exact" ? (
            <div style={{ maxWidth: "220px" }}><TimePicker value={reminderTime} onChange={setReminderTime} /></div>
          ) : (
            <RandomRangePicker startTime={reminderTime} endTime={reminderEndTime} onStartChange={setReminderTime} onEndChange={setReminderEndTime} contextNote="every day" />
          )}
        </div>
      )}

      {reminderFreqType === "weekly" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#605e5c", marginBottom: "6px" }}>Days of the Week</label>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {[{ id: 1, label: "Mon" }, { id: 2, label: "Tue" }, { id: 3, label: "Wed" }, { id: 4, label: "Thu" }, { id: 5, label: "Fri" }, { id: 6, label: "Sat" }, { id: 0, label: "Sun" }].map((d) => {
                const isSelected = reminderDays.includes(d.id);
                return (
                  <Button key={d.id} type="button" variant={isSelected ? "primary" : "ghost"} size="sm" onClick={() => toggleDay(d.id)} style={{ border: isSelected ? "1.5px solid #742774" : "1px solid #e1dfdd", padding: "6px 14px", fontSize: "12.5px" }}>
                    {d.label}
                  </Button>
                );
              })}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label style={{ fontSize: "12px", fontWeight: "600", color: "#605e5c" }}>
              {reminderTimeMode === "random_window" ? "Random Interval Between (Start & End Time)" : "Execution Time"}
            </label>
            <Button type="button" variant={reminderTimeMode === "random_window" ? "primary" : "outline"} size="sm" onClick={toggleRandomWindow}>
              Random in Interval
            </Button>
          </div>
          {reminderTimeMode === "exact" ? (
            <div style={{ maxWidth: "220px" }}><TimePicker value={reminderTime} onChange={setReminderTime} /></div>
          ) : (
            <RandomRangePicker startTime={reminderTime} endTime={reminderEndTime} onStartChange={setReminderTime} onEndChange={setReminderEndTime} contextNote="on selected days" />
          )}
        </div>
      )}

      {reminderFreqType === "random_interval" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#605e5c", marginBottom: "6px" }}>Interval Between (Random Delay)</label>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "12px", color: "#605e5c" }}>Min:</span>
                <Input type="number" min={1} max={1440} value={reminderMinInterval} onChange={(e) => {
                  const v = Math.max(1, Number(e.target.value) || 1);
                  setReminderMinInterval(v);
                  if (v > reminderMaxInterval) setReminderMaxInterval(v);
                }} style={{ width: "75px" }} />
              </div>
              <span style={{ fontSize: "12px", color: "#605e5c", fontWeight: "600" }}>to</span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "12px", color: "#605e5c" }}>Max:</span>
                <Input type="number" min={1} max={1440} value={reminderMaxInterval} onChange={(e) => setReminderMaxInterval(Math.max(1, Number(e.target.value) || 1))} style={{ width: "75px" }} />
              </div>
              <Select value={reminderIntervalUnit} onChange={(e) => setReminderIntervalUnit(e.target.value as "minutes" | "hours")}>
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
              </Select>
            </div>
            {reminderMinInterval > reminderMaxInterval ? (
              <div style={{ fontSize: "11.5px", color: "#a4262c", marginTop: "4px", fontWeight: "600" }}>⚠️ Max interval must be greater than or equal to Min interval.</div>
            ) : (
              <div style={{ fontSize: "11px", color: "#605e5c", marginTop: "4px" }}>Action will trigger with a random interval between {reminderMinInterval} and {reminderMaxInterval} {reminderIntervalUnit}.</div>
            )}
          </div>

          <div style={{ borderTop: "1px dashed #e1dfdd", paddingTop: "10px" }}>
            <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600", color: "#323130" }}>
              <Input type="checkbox" checked={reminderUseTimeWindow} onChange={(e) => setReminderUseTimeWindow(e.target.checked)} style={{ width: "15px", height: "15px" }} />
              <span>Restrict execution to active time window</span>
            </label>
            {reminderUseTimeWindow && (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", width: "150px" }}>
                    <span style={{ fontSize: "11.5px", color: "#605e5c" }}>From:</span>
                    <TimePicker value={reminderWindowStartTime || "08:00"} onChange={setReminderWindowStartTime} hasEmptyOption={false} fallbackHour="08" />
                  </div>
                  <span style={{ fontSize: "12px", color: "#605e5c" }}>to</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", width: "150px" }}>
                    <span style={{ fontSize: "11.5px", color: "#605e5c" }}>To:</span>
                    <TimePicker value={reminderWindowEndTime || "20:00"} onChange={setReminderWindowEndTime} hasEmptyOption={false} fallbackHour="20" />
                  </div>
                </div>
                {(() => {
                  const [sh = 8, sm = 0] = (reminderWindowStartTime || "08:00").split(":").map(Number);
                  const [eh = 20, em = 0] = (reminderWindowEndTime || "20:00").split(":").map(Number);
                  const sMins = sh * 60 + sm, eMins = eh * 60 + em, duration = eMins - sMins;
                  const minInt = reminderIntervalUnit === "hours" ? reminderMinInterval * 60 : reminderMinInterval;
                  if (eMins <= sMins) return <div style={{ fontSize: "11.5px", color: "#a4262c", fontWeight: "600" }}>⚠️ End time must be after start time.</div>;
                  if (duration < minInt) return <div style={{ fontSize: "11.5px", color: "#a4262c", fontWeight: "600" }}>⚠️ Window ({duration}m) is shorter than min interval ({minInt}m).</div>;
                  return null;
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {reminderFreqType === "hourly" && (
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#605e5c", marginBottom: "4px" }}>Minute of the Hour</label>
          <Select value={reminderMinute} onChange={(e) => setReminderMinute(Number(e.target.value))}>
            <option value={0}>Minute :00</option>
            <option value={15}>Minute :15</option>
            <option value={30}>Minute :30</option>
            <option value={45}>Minute :45</option>
          </Select>
        </div>
      )}

      {reminderFreqType === "interval" && (
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#605e5c", marginBottom: "4px" }}>Repeat Every</label>
          <Select value={reminderIntervalMinutes} onChange={(e) => setReminderIntervalMinutes(Number(e.target.value))}>
            <option value={15}>Every 15 minutes</option>
            <option value={30}>Every 30 minutes</option>
            <option value={45}>Every 45 minutes</option>
            <option value={60}>Every 60 minutes</option>
            <option value={120}>Every 2 hours</option>
          </Select>
        </div>
      )}

      {reminderFreqType === "monthly" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#605e5c", marginBottom: "4px" }}>Day of the Month</label>
            <Select value={reminderDayOfMonth} onChange={(e) => setReminderDayOfMonth(Number(e.target.value))} style={{ width: "100%" }}>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>Day {d}</option>
              ))}
            </Select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#605e5c", marginBottom: "6px" }}>Execution Time</label>
            <TimePicker value={reminderTime} onChange={setReminderTime} />
          </div>
        </div>
      )}
    </>
  );
}
