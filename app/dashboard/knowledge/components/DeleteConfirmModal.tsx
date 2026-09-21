"use client";

import React from "react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Trash2, X, Loader2 } from "lucide-react";
import { DeleteTarget } from "../types";

interface DeleteConfirmModalProps {
  deleteTarget: DeleteTarget | null;
  deleting: boolean;
  onClose: () => void;
  onConfirmDelete: () => Promise<void>;
}

export default function DeleteConfirmModal({
  deleteTarget,
  deleting,
  onClose,
  onConfirmDelete
}: DeleteConfirmModalProps) {
  return (
    <Modal
      isOpen={!!deleteTarget}
      onClose={onClose}
      title="Delete"
      icon={<Trash2 style={{ width: "20px", height: "20px", color: "var(--destructive, #ef4444)" }} />}
      maxWidth="sm"
      footer={
        <>
          <Button
            variant="ghost"
            size="md"
            disabled={deleting}
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button
            variant="danger"
            size="md"
            disabled={deleting}
            onClick={onConfirmDelete}
          >
            {deleting ? <Loader2 className="animate-spin" style={{ width: "14px", height: "14px" }} /> : "Delete"}
          </Button>
        </>
      }
    >
      {deleteTarget && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <p style={{ fontSize: "13.5px", color: "#334155", margin: 0, lineHeight: "1.5" }}>
            Are you sure you want to delete {deleteTarget.title} <strong style={{ color: "#0E2440" }}>&apos;{deleteTarget.name}&apos;</strong>?
          </p>

          <div style={{
            background: "#fef2f2",
            border: "1px solid #fee2e2",
            borderRadius: "12px",
            padding: "12px 14px",
            display: "flex",
            alignItems: "flex-start",
            gap: "10px"
          }}>
            <div style={{
              width: "22px",
              height: "22px",
              borderRadius: "50%",
              background: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              flexShrink: 0,
              marginTop: "1px"
            }}>
              <X style={{ width: "14px", height: "14px", strokeWidth: 3 }} />
            </div>
            <span style={{ fontSize: "12.5px", fontWeight: "600", color: "#dc2626", lineHeight: "1.4" }}>
              {deleteTarget.warning}
            </span>
          </div>
        </div>
      )}
    </Modal>
  );
}
