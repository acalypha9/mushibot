"use client";

import React from "react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Trash2 } from "lucide-react";
import { DeleteModalState } from "./useConversationData";

interface DeleteConversationModalProps {
  deleteModal: DeleteModalState;
  onClose: () => void;
}

export function DeleteConversationModal({
  deleteModal,
  onClose
}: DeleteConversationModalProps) {
  return (
    <Modal
      isOpen={deleteModal.show}
      onClose={onClose}
      title={deleteModal.title}
      icon={<Trash2 style={{ width: "20px", height: "20px", color: "#e15a64" }} />}
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
            onClick={deleteModal.onConfirm}
          >
            Delete
          </Button>
        </>
      }
    >
      <p style={{ fontSize: "13.5px", color: "var(--muted-foreground)", margin: 0, lineHeight: 1.5 }}>
        {deleteModal.message}
      </p>
    </Modal>
  );
}
