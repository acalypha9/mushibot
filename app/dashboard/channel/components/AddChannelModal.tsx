"use client";

import React from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Plus, AlertCircle, ChevronDown } from "lucide-react";
import { ModelOptionItem, formatModelLabel } from "../types";

interface AddChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  error: string | null;
  channelType: "WHATSAPP" | "TELEGRAM";
  setChannelType: (type: "WHATSAPP" | "TELEGRAM") => void;
  channelName: string;
  setChannelName: (name: string) => void;
  channelDesc: string;
  setChannelDesc: (desc: string) => void;
  channelModel: string;
  setChannelModel: (model: string) => void;
  defaultModelName: string;
  configuredModelsList: ModelOptionItem[];
}

export default function AddChannelModal({
  isOpen,
  onClose,
  onSubmit,
  error,
  channelType,
  setChannelType,
  channelName,
  setChannelName,
  channelDesc,
  setChannelDesc,
  channelModel,
  setChannelModel,
  defaultModelName,
  configuredModelsList,
}: AddChannelModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Channel"
      icon={<Plus style={{ width: "20px", height: "20px", color: "var(--primary)" }} />}
      maxWidth="md"
    >
      <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {error && (
          <div
            role="alert"
            style={{
              padding: "10px 14px",
              background: "#fef2f2",
              border: "1px solid #fca5a5",
              color: "#dc2626",
              borderRadius: "10px",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <AlertCircle style={{ width: "16px", height: "16px", flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}
        <div>
          <label htmlFor="add-channel-type" style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
            Channel Type *
          </label>
          <div style={{ position: "relative", marginTop: "4px" }}>
            <Select
              id="add-channel-type"
              value={channelType}
              onChange={(e) => setChannelType(e.target.value as "WHATSAPP" | "TELEGRAM")}
            >
              <option value="WHATSAPP">WhatsApp</option>
              <option value="TELEGRAM">Telegram</option>
            </Select>
            <ChevronDown
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "16px",
                height: "16px",
                color: "var(--muted-foreground)",
                pointerEvents: "none",
              }}
            />
          </div>
        </div>

        <div>
          <label htmlFor="add-channel-name" style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
            Channel Name *
          </label>
          <Input
            id="add-channel-name"
            required
            type="text"
            placeholder="Enter channel name..."
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="add-channel-desc" style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
            Description
          </label>
          <Input
            id="add-channel-desc"
            type="text"
            placeholder="Enter optional description..."
            value={channelDesc}
            onChange={(e) => setChannelDesc(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="add-channel-model" style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
            Chat Model Provider *
          </label>
          <div style={{ position: "relative", marginTop: "4px" }}>
            <Select
              id="add-channel-model"
              value={channelModel}
              onChange={(e) => setChannelModel(e.target.value)}
            >
              <option value="">{defaultModelName ? `Default (${defaultModelName})` : "Select Chat Model Provider"}</option>
              {configuredModelsList.map((m, idx) => (
                <option key={`${m.id}-${idx}`} value={m.id}>
                  {formatModelLabel(m)}
                </option>
              ))}
            </Select>
            <ChevronDown
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "16px",
                height: "16px",
                color: "var(--muted-foreground)",
                pointerEvents: "none",
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
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
            Add Channel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
