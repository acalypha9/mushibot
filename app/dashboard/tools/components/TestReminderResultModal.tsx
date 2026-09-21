"use client";

import React from "react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface TestReminderResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: {
    success?: boolean;
    message?: string;
    details?: unknown;
  } | null;
  reminderTitle: string;
}

export default function TestReminderResultModal({
  isOpen,
  onClose,
  result,
  reminderTitle,
}: TestReminderResultModalProps) {
  const isSuccess = Boolean(result?.success);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Test Reminder: ${reminderTitle}`}
      icon={
        isSuccess ? (
          <CheckCircle2 style={{ width: "20px", height: "20px", color: "var(--success, #16a34a)" }} />
        ) : (
          <AlertCircle style={{ width: "20px", height: "20px", color: "var(--destructive)" }} />
        )
      }
      maxWidth="md"
      footer={
        <Button type="button" variant="primary" size="md" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "var(--radius-sm, 6px)",
            background: isSuccess ? "rgba(22, 163, 74, 0.1)" : "rgba(220, 38, 38, 0.1)",
            border: `1px solid ${isSuccess ? "rgba(22, 163, 74, 0.3)" : "rgba(220, 38, 38, 0.3)"}`,
            color: isSuccess ? "var(--success, #15803d)" : "var(--destructive)",
            fontSize: "13px",
            fontWeight: "600",
          }}
        >
          {result?.message || "Execution processed."}
        </div>

        {Boolean(result?.details) && (
          <div>
            <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--muted-foreground)", marginBottom: "6px" }}>
              Delivery Log Details:
            </div>
            <pre
              style={{
                padding: "12px",
                borderRadius: "var(--radius-sm, 6px)",
                background: "var(--background)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
                fontSize: "12px",
                fontFamily: "var(--font-mono)",
                margin: 0,
                overflowX: "auto",
              }}
            >
              {JSON.stringify(result?.details, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Modal>
  );
}
