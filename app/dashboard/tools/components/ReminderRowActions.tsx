"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { CronReminderItem } from "../types";
import { Loader2, Play, Edit3, Trash2 } from "lucide-react";

interface ReminderRowActionsProps {
  rem: CronReminderItem;
  isTriggering: boolean;
  onTriggerNow: (rem: CronReminderItem, e?: React.MouseEvent) => void;
  onOpenEditModal: (rem: CronReminderItem) => void;
  onDeleteTarget: (rem: CronReminderItem) => void;
}

export default function ReminderRowActions({
  rem,
  isTriggering,
  onTriggerNow,
  onOpenEditModal,
  onDeleteTarget,
}: ReminderRowActionsProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: "8px",
        justifyContent: "flex-end",
        alignItems: "center",
      }}
    >
      <Button
        variant="outline"
        size="sm"
        onClick={(e) => onTriggerNow(rem, e)}
        disabled={isTriggering}
        title="Test Reminder Now"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        {isTriggering ? (
          <Loader2 className="animate-spin" style={{ width: "12px", height: "12px" }} />
        ) : (
          <Play style={{ width: "12px", height: "12px" }} />
        )}
        <span>Test</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onOpenEditModal(rem)}
        title="Edit Reminder"
        style={{ color: "#605e5c", padding: "4px" }}
      >
        <Edit3 style={{ width: "15px", height: "15px" }} />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDeleteTarget(rem)}
        title="Delete Reminder"
        style={{ color: "#a4262c", padding: "4px" }}
      >
        <Trash2 style={{ width: "15px", height: "15px" }} />
      </Button>
    </div>
  );
}
