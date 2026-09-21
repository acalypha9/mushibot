"use client";

import React from "react";
import { Input } from "@/components/ui/Input";
import { AlertCircle } from "lucide-react";

export interface ReminderBasicFieldsProps {
  title: string;
  setTitle: (val: string) => void;
  formError: string | null;
}

export function ReminderBasicFields({
  title,
  setTitle,
  formError,
}: ReminderBasicFieldsProps) {
  return (
    <>
      {formError && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "6px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#dc2626",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <AlertCircle style={{ width: "16px", height: "16px", flexShrink: 0 }} />
          <span>{formError}</span>
        </div>
      )}

      <div>
        <label
          style={{
            display: "block",
            fontSize: "12.5px",
            fontWeight: "700",
            color: "#323130",
            marginBottom: "6px",
          }}
        >
          Reminder Title <span style={{ color: "#a4262c" }}>*</span>
        </label>
        <Input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Daily Team Standup"
        />
      </div>
    </>
  );
}

export function ReminderActiveToggle({
  isActive,
  setIsActive,
}: {
  isActive: boolean;
  setIsActive: (val: boolean) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 14px",
        borderRadius: "6px",
        background: "#faf9f8",
        border: "1px solid #edebe9",
      }}
    >
      <div>
        <div style={{ fontSize: "13px", fontWeight: "700", color: "#323130" }}>Active Status</div>
        <div style={{ fontSize: "11.5px", color: "#605e5c", marginTop: "2px" }}>
          Enable automated schedule immediately
        </div>
      </div>
      <label
        style={{
          position: "relative",
          display: "inline-block",
          width: "42px",
          height: "22px",
          cursor: "pointer",
        }}
      >
        <Input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          style={{ opacity: 0, width: 0, height: 0, position: "absolute" }}
        />
        <span
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: isActive ? "#742774" : "#e2e8f0",
            transition: ".2s",
            borderRadius: "22px",
          }}
        >
          <span
            style={{
              position: "absolute",
              content: '""',
              height: "16px",
              width: "16px",
              left: isActive ? "23px" : "3px",
              bottom: "3px",
              backgroundColor: "#ffffff",
              transition: ".2s",
              borderRadius: "50%",
              boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
            }}
          />
        </span>
      </label>
    </div>
  );
}
