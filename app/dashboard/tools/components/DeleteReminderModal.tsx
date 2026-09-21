"use client";

import React from "react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { CronReminderItem } from "../types";
import { Trash2 } from "lucide-react";

interface DeleteReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetReminder?: CronReminderItem | null;
  selectedCount?: number;
  deleting: boolean;
  onConfirmDelete: () => void;
}

export default function DeleteReminderModal({
  isOpen,
  onClose,
  targetReminder,
  selectedCount,
  deleting,
  onConfirmDelete,
}: DeleteReminderModalProps) {
  const isBulk = Boolean(selectedCount && selectedCount > 0);

  return (
    <Modal
      isOpen={isOpen && (Boolean(targetReminder) || isBulk)}
      onClose={onClose}
      title={isBulk ? "Delete Reminders" : "Delete Reminder"}
      icon={<Trash2 style={{ width: "20px", height: "20px", color: "var(--destructive)" }} />}
      maxWidth="sm"
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", width: "100%" }}>
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onClose}
            style={{ border: "1px solid var(--border)" }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="md"
            onClick={onConfirmDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Confirm Delete"}
          </Button>
        </div>
      }
    >
      <p style={{ fontSize: "13px", color: "var(--foreground)", margin: 0, lineHeight: 1.5 }}>
        {isBulk ? (
          <>
            Are you sure you want to delete <strong>{selectedCount}</strong> selected scheduled reminder(s)?
            This will permanently cancel all upcoming executions.
          </>
        ) : (
          <>
            Are you sure you want to delete the scheduled reminder <strong>&quot;{targetReminder?.title}&quot;</strong>?
            This will permanently cancel all upcoming executions.
          </>
        )}
      </p>
    </Modal>
  );
}
