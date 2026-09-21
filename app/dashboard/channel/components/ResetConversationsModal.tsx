"use client";

import React from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { RotateCcw, AlertCircle } from "lucide-react";

interface ResetConversationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  loading: boolean;
}

export default function ResetConversationsModal({
  isOpen,
  onClose,
  onConfirm,
  loading,
}: ResetConversationsModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const isBusy = loading || isSubmitting;

  const handleClose = () => {
    if (!isBusy) {
      onClose();
    }
  };

  const handleConfirmClick = async () => {
    if (isBusy) {
      return;
    }
    setIsSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      closeOnBackdropClick={!isBusy}
      title="Reset All Conversations"
      icon={<RotateCcw style={{ width: "20px", height: "20px", color: "#e11d48" }} />}
      maxWidth="lg"
      footer={
        <>
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={handleClose}
            disabled={isBusy}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="md"
            onClick={handleConfirmClick}
            disabled={isBusy}
          >
            <RotateCcw style={{ width: "14px", height: "14px", animation: isBusy ? "spin 1s linear infinite" : "none" }} />
            <span>{isBusy ? "Resetting..." : "Confirm Reset"}</span>
          </Button>
        </>
      }
    >
      <div
        role="alert"
        style={{
          border: "1px solid #fde68a",
          padding: "14px 18px",
          borderRadius: "12px",
          background: "#fffbeb",
          color: "#b45309",
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          fontSize: "13.5px",
          lineHeight: "1.5",
        }}
      >
        <AlertCircle style={{ width: "18px", height: "18px", color: "#d97706", flexShrink: 0, marginTop: "2px" }} />
        <span>
          Are you sure you want to reset all conversation history for this channel? This will permanently delete all conversation logs and clear active AI session memory. This action cannot be undone.
        </span>
      </div>
    </Modal>
  );
}
