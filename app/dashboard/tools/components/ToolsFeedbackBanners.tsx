"use client";

import React from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface ToolsFeedbackBannersProps {
  errorMsg: string | null;
  successMsg: string | null;
}

export default function ToolsFeedbackBanners({
  errorMsg,
  successMsg,
}: ToolsFeedbackBannersProps) {
  if (!errorMsg && !successMsg) return null;

  return (
    <>
      {errorMsg && (
        <div
          style={{
            padding: "10px 14px",
            background: "#fef2f2",
            border: "1px solid #f87171",
            borderRadius: "6px",
            color: "#991b1b",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <AlertCircle style={{ width: "16px", height: "16px", flexShrink: 0 }} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div
          style={{
            padding: "10px 14px",
            background: "#f0fdf4",
            border: "1px solid #4ade80",
            borderRadius: "6px",
            color: "#166534",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <CheckCircle2 style={{ width: "16px", height: "16px", flexShrink: 0 }} />
          <span>{successMsg}</span>
        </div>
      )}
    </>
  );
}
