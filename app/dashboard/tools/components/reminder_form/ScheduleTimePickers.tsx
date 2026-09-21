"use client";

import React from "react";
import { Select } from "@/components/ui/Input";

export function TimePicker({
  value,
  onChange,
  hasEmptyOption = true,
  fallbackHour = "09",
  fallbackMinute = "00",
}: {
  value: string;
  onChange: (val: string) => void;
  hasEmptyOption?: boolean;
  fallbackHour?: string;
  fallbackMinute?: string;
}) {
  const [h, m] = (value || "").split(":");
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", width: "100%" }}>
      <Select
        value={h || (hasEmptyOption ? "" : fallbackHour)}
        onChange={(e) => {
          const newH = e.target.value;
          if (hasEmptyOption && !newH) onChange("");
          else onChange(`${newH}:${m || fallbackMinute}`);
        }}
        style={{ flex: 1 }}
      >
        {hasEmptyOption && <option value="">Hour</option>}
        {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")).map((hr) => (
          <option key={hr} value={hr}>{hr}</option>
        ))}
      </Select>
      <span style={{ fontWeight: "700", color: "#605e5c", fontSize: "13px" }}>:</span>
      <Select
        value={m || (hasEmptyOption ? "" : fallbackMinute)}
        onChange={(e) => {
          const newM = e.target.value;
          if (hasEmptyOption && !newM) onChange("");
          else onChange(`${h || fallbackHour}:${newM}`);
        }}
        style={{ flex: 1 }}
      >
        {hasEmptyOption && <option value="">Minute</option>}
        {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")).map((min) => (
          <option key={min} value={min}>{min}</option>
        ))}
      </Select>
    </div>
  );
}

export function RandomRangePicker({
  startTime,
  endTime,
  onStartChange,
  onEndChange,
  contextNote,
}: {
  startTime: string;
  endTime: string;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
  contextNote: string;
}) {
  const [sh = 9, sm = 0] = (startTime || "09:00").split(":").map(Number);
  const [eh = 17, em = 0] = (endTime || "17:00").split(":").map(Number);
  const isInvalid = eh * 60 + em <= sh * 60 + sm;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
        <div style={{ width: "160px" }}>
          <TimePicker value={startTime || "09:00"} onChange={onStartChange} hasEmptyOption={false} fallbackHour="09" />
        </div>
        <span style={{ fontSize: "12px", color: "#605e5c", fontWeight: "600" }}>to</span>
        <div style={{ width: "160px" }}>
          <TimePicker value={endTime || "17:00"} onChange={onEndChange} hasEmptyOption={false} fallbackHour="17" />
        </div>
      </div>
      {isInvalid ? (
        <div style={{ fontSize: "11.5px", color: "#a4262c", marginTop: "4px", fontWeight: "600" }}>
          ⚠️ End time must be later than start time.
        </div>
      ) : (
        <div style={{ fontSize: "11px", color: "#605e5c", marginTop: "4px" }}>
          Action will trigger at a random time between {startTime || "09:00"} and {endTime || "17:00"} {contextNote}.
        </div>
      )}
    </div>
  );
}
