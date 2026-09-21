"use client";

import React from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Trash2 } from "lucide-react";

interface DeleteProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: () => void;
}

export function DeleteProviderModal({
  isOpen,
  onClose,
  onConfirmDelete
}: DeleteProviderModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Provider Source"
      icon={<Trash2 style={{ width: "20px", height: "20px", color: "var(--destructive, #ef4444)" }} />}
      maxWidth="sm"
      footer={
        <>
          <Button type="button" variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="danger" size="md" onClick={onConfirmDelete}>
            Delete
          </Button>
        </>
      }
    >
      <p style={{ fontSize: "13.5px", color: "var(--muted-foreground)", margin: 0, lineHeight: 1.5 }}>
        Are you sure you want to delete this provider source? This action cannot be undone.
      </p>
    </Modal>
  );
}
