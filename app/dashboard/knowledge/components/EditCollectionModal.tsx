"use client";

import React, { FormEvent } from "react";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { Edit } from "lucide-react";
import { Collection } from "../types";

interface EditCollectionModalProps {
  editingCol: Collection | null;
  onClose: () => void;
  colName: string;
  colDesc: string;
  onSetColName: (val: string) => void;
  onSetColDesc: (val: string) => void;
  onUpdateCollection: (e: FormEvent) => Promise<void>;
}

export default function EditCollectionModal({
  editingCol,
  onClose,
  colName,
  colDesc,
  onSetColName,
  onSetColDesc,
  onUpdateCollection
}: EditCollectionModalProps) {
  return (
    <Modal
      isOpen={!!editingCol}
      onClose={onClose}
      title="Edit Collection"
      icon={<Edit style={{ width: "20px", height: "20px", color: "var(--primary)" }} />}
      maxWidth="md"
    >
      <form onSubmit={onUpdateCollection} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <div>
          <label style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "var(--muted-foreground)" }}>Collection Name</label>
          <Input
            required
            type="text"
            value={colName}
            onChange={(e) => onSetColName(e.target.value)}
            style={{ marginTop: "4px" }}
          />
        </div>
        <div>
          <label style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "var(--muted-foreground)" }}>Description</label>
          <Input
            type="text"
            value={colDesc}
            onChange={(e) => onSetColDesc(e.target.value)}
            style={{ marginTop: "4px" }}
          />
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
