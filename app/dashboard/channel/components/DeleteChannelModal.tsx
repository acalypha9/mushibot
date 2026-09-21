"use client";

import React from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Trash2 } from "lucide-react";
import { ChannelItem } from "../types";

interface DeleteChannelModalProps {
  channel: ChannelItem | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

export default function DeleteChannelModal({
  channel,
  onClose,
  onConfirm,
}: DeleteChannelModalProps) {
  return (
    <Modal
      isOpen={!!channel}
      onClose={onClose}
      title="Remove Channel?"
      icon={<Trash2 style={{ width: "20px", height: "20px", color: "var(--destructive, #ef4444)" }} />}
      maxWidth="sm"
      footer={
        <>
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="md"
            onClick={() => channel && onConfirm(channel.id)}
          >
            Delete
          </Button>
        </>
      }
    >
      <p style={{ fontSize: "13.5px", color: "var(--muted-foreground)", margin: 0, lineHeight: "1.5" }}>
        Are you sure you want to remove <strong>{channel?.name}</strong>?
      </p>
    </Modal>
  );
}
