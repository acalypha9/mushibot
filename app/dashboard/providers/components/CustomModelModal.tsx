"use client";

import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Plus } from "lucide-react";
import { ConfiguredModel } from "../types";

interface CustomModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerName: string;
  onAddCustomModel: (model: ConfiguredModel) => void;
}

export function CustomModelModal({
  isOpen,
  onClose,
  providerName,
  onAddCustomModel
}: CustomModelModalProps) {
  const [customModelId, setCustomModelId] = useState("");
  const [customModelName, setCustomModelName] = useState("");
  const [customHasVision, setCustomHasVision] = useState(true);
  const [customHasAudio, setCustomHasAudio] = useState(false);
  const [customHasTools, setCustomHasTools] = useState(true);
  const [customContextLength, setCustomContextLength] = useState("");

  const handleAdd = () => {
    if (!customModelId.trim()) return;
    const modelName = customModelName.trim() || customModelId.trim();
    const fullId = customModelId.includes("/")
      ? customModelId
      : `${providerName || "provider"}/${customModelId}`;

    const newModel: ConfiguredModel = {
      id: fullId,
      name: modelName,
      is_active: true,
      has_vision: customHasVision,
      has_audio: customHasAudio,
      has_tools: customHasTools,
      context_length: customContextLength || undefined
    };

    onAddCustomModel(newModel);
    onClose();
    setCustomModelId("");
    setCustomModelName("");
    setCustomContextLength("");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Custom Model"
      icon={<Plus style={{ width: "20px", height: "20px", color: "var(--primary)" }} />}
      maxWidth="md"
      footer={
        <>
          <Button type="button" variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="primary" size="md" onClick={handleAdd}>
            Add Model
          </Button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label
            style={{
              fontSize: "11px",
              fontWeight: "bold",
              textTransform: "uppercase",
              color: "var(--muted-foreground)"
            }}
          >
            Model ID
          </label>
          <Input
            type="text"
            placeholder="gpt-4o-mini"
            value={customModelId}
            onChange={(e) => setCustomModelId(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label
            style={{
              fontSize: "11px",
              fontWeight: "bold",
              textTransform: "uppercase",
              color: "var(--muted-foreground)"
            }}
          >
            Display Name
          </label>
          <Input
            type="text"
            placeholder="Anthropic new model"
            value={customModelName}
            onChange={(e) => setCustomModelName(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label
            style={{
              fontSize: "11px",
              fontWeight: "bold",
              textTransform: "uppercase",
              color: "var(--muted-foreground)"
            }}
          >
            Context Window Size
          </label>
          <Input
            type="text"
            placeholder="128000 or 262144"
            value={customContextLength}
            onChange={(e) => setCustomContextLength(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label
            style={{
              fontSize: "11px",
              fontWeight: "bold",
              textTransform: "uppercase",
              color: "var(--muted-foreground)"
            }}
          >
            Capabilities
          </label>
          <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: "var(--foreground)" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                fontWeight: "600"
              }}
            >
              <Input
                type="checkbox"
                checked={customHasVision}
                onChange={(e) => setCustomHasVision(e.target.checked)}
                style={{ accentColor: "var(--primary)", width: "16px", height: "16px" }}
              />{" "}
              Vision
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                fontWeight: "600"
              }}
            >
              <Input
                type="checkbox"
                checked={customHasAudio}
                onChange={(e) => setCustomHasAudio(e.target.checked)}
                style={{ accentColor: "var(--primary)", width: "16px", height: "16px" }}
              />{" "}
              Audio
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                fontWeight: "600"
              }}
            >
              <Input
                type="checkbox"
                checked={customHasTools}
                onChange={(e) => setCustomHasTools(e.target.checked)}
                style={{ accentColor: "var(--primary)", width: "16px", height: "16px" }}
              />{" "}
              Tools
            </label>
          </div>
        </div>
      </div>
    </Modal>
  );
}
