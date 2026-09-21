"use client";

import React, { FormEvent } from "react";
import Button from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { BookOpen, AlertCircle } from "lucide-react";

interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  colName: string;
  colDesc: string;
  colEmbeddingModel: string;
  colParserModel: string;
  colErrorMsg: string | null;
  availableEmbeddingModels: string[];
  onSetColName: (val: string) => void;
  onSetColDesc: (val: string) => void;
  onSetColEmbeddingModel: (val: string) => void;
  onSetColParserModel: (val: string) => void;
  onCreateCollection: (e: FormEvent) => Promise<void>;
}

export default function CreateCollectionModal({
  isOpen,
  onClose,
  colName,
  colDesc,
  colEmbeddingModel,
  colParserModel,
  colErrorMsg,
  availableEmbeddingModels,
  onSetColName,
  onSetColDesc,
  onSetColEmbeddingModel,
  onSetColParserModel,
  onCreateCollection
}: CreateCollectionModalProps) {
  const selectedEmbModel = colEmbeddingModel || availableEmbeddingModels[0] || "";
  const isValid = colName.trim().length > 0 && selectedEmbModel.length > 0 && availableEmbeddingModels.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Collection"
      icon={<BookOpen style={{ width: "20px", height: "20px", color: "var(--primary)" }} />}
      maxWidth="md"
    >
      <form onSubmit={onCreateCollection} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {availableEmbeddingModels.length === 0 && (
          <div style={{
            border: "1px solid #fde68a",
            padding: "10px 14px",
            borderRadius: "10px",
            background: "#fffbeb",
            color: "#b45309",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12.5px"
          }}>
            <AlertCircle style={{ width: "16px", height: "16px", flexShrink: 0 }} />
            <span>No embedding provider configured. Please add an embedding model in <strong>Dashboard &gt; Providers</strong> first.</span>
          </div>
        )}

        {colErrorMsg && (
          <div style={{
            border: "1px solid #fca5a5",
            padding: "10px 14px",
            borderRadius: "10px",
            background: "#fef2f2",
            color: "#b91c1c",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12.5px"
          }}>
            <AlertCircle style={{ width: "16px", height: "16px", flexShrink: 0 }} />
            <span>{colErrorMsg}</span>
          </div>
        )}

        <div>
          <label style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "var(--muted-foreground)" }}>Collection Name *</label>
          <Input
            required
            type="text"
            placeholder="Enter collection name..."
            value={colName}
            onChange={(e) => onSetColName(e.target.value)}
            style={{ marginTop: "4px" }}
          />
        </div>
        <div>
          <label style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "var(--muted-foreground)" }}>Description</label>
          <Input
            type="text"
            placeholder="Enter optional description..."
            value={colDesc}
            onChange={(e) => onSetColDesc(e.target.value)}
            style={{ marginTop: "4px" }}
          />
        </div>
        <div>
          <label style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "var(--muted-foreground)" }}>Embedding Provider *</label>
          <Select
            disabled={availableEmbeddingModels.length === 0}
            value={colEmbeddingModel || availableEmbeddingModels[0] || ""}
            onChange={(e) => onSetColEmbeddingModel(e.target.value)}
            style={{
              marginTop: "4px",
              cursor: availableEmbeddingModels.length === 0 ? "not-allowed" : "pointer",
              opacity: availableEmbeddingModels.length === 0 ? 0.7 : 1,
            }}
          >
            {availableEmbeddingModels.length > 0 ? (
              availableEmbeddingModels.map((m, idx) => (
                <option key={`${m}-${idx}`} value={m}>
                  {m}
                </option>
              ))
            ) : (
              <option value="">No configured models</option>
            )}
          </Select>
        </div>
        <div>
          <label style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "var(--muted-foreground)" }}>Parser Model</label>
          <Select
            disabled
            value={colParserModel}
            onChange={(e) => onSetColParserModel(e.target.value)}
            style={{
              marginTop: "4px",
              cursor: "not-allowed",
            }}
          >
            <option value="LlamaCloud">LlamaCloud</option>
          </Select>
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
            disabled={!isValid}
          >
            Create Collection
          </Button>
        </div>
      </form>
    </Modal>
  );
}
