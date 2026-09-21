"use client";

import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Activity, Trash2, Eye, EyeOff } from "lucide-react";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onConfirmApiKey: (combinedApiKey: string) => void;
}

function parseKeys(raw: string): string[] {
  if (!raw || !raw.trim()) return [];
  return raw
    .split(/[\r\n,]+/)
    .map((k) => k.trim())
    .filter(Boolean);
}

function maskApiKey(key: string): string {
  const trimmed = key.trim();
  if (trimmed.length <= 8) return "••••••••";
  return `${trimmed.slice(0, 4)}••••${trimmed.slice(-4)}`;
}

export function ApiKeyModal({
  isOpen,
  onClose,
  apiKey,
  onConfirmApiKey
}: ApiKeyModalProps) {
  const [apiKeyList, setApiKeyList] = useState<string[]>([]);
  const [newApiKeyInput, setNewApiKeyInput] = useState("");
  const [revealedIndices, setRevealedIndices] = useState<Record<number, boolean>>({});
  const [prevIsOpen, setPrevIsOpen] = useState(false);
  const [prevApiKey, setPrevApiKey] = useState(apiKey);

  if (isOpen !== prevIsOpen || apiKey !== prevApiKey) {
    setPrevIsOpen(isOpen);
    setPrevApiKey(apiKey);
    if (isOpen) {
      setApiKeyList(parseKeys(apiKey));
      setNewApiKeyInput("");
      setRevealedIndices({});
    }
  }

  const handleAddApiKeyItem = (rawText?: string) => {
    const textToProcess = (rawText !== undefined ? rawText : newApiKeyInput).trim();
    if (!textToProcess) return;

    const items = parseKeys(textToProcess);
    if (items.length > 0) {
      setApiKeyList((prev) => [...prev, ...items]);
    }
    setNewApiKeyInput("");
  };

  const handleRemoveApiKeyItem = (index: number) => {
    setApiKeyList((prev) => prev.filter((_, i) => i !== index));
    setRevealedIndices((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const toggleReveal = (index: number) => {
    setRevealedIndices((prev) => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleConfirm = () => {
    const combinedKey = apiKeyList.join(", ");
    onConfirmApiKey(combinedKey);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit API Keys"
      icon={<Activity style={{ width: "20px", height: "20px", color: "var(--primary)" }} />}
      maxWidth="lg"
      footer={
        <>
          <Button type="button" variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="primary" size="md" onClick={handleConfirm}>
            Confirm
          </Button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* INPUT ROW */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <Input
            type="text"
            name="additional_provider_token_item"
            autoComplete="off"
            data-form-type="other"
            data-lpignore="true"
            data-1p-ignore="true"
            data-bwignore="true"
            data-dashlane-ignore="true"
            spellCheck={false}
            placeholder="Add new item, press Enter to confirm"
            value={newApiKeyInput}
            onChange={(e) => {
              const val = e.target.value;
              if (val.includes("\n") || val.includes("\r")) {
                handleAddApiKeyItem(val);
              } else {
                setNewApiKeyInput(val);
              }
            }}
            onPaste={(e) => {
              const pastedText = e.clipboardData.getData("text");
              if (
                pastedText &&
                (pastedText.includes("\n") ||
                  pastedText.includes(",") ||
                  pastedText.includes("\r"))
              ) {
                e.preventDefault();
                handleAddApiKeyItem(pastedText);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddApiKeyItem();
              }
            }}
            style={{
              flexGrow: 1,
              fontFamily: "var(--font-mono)",
              fontSize: "13px"
            }}
          />
          <Button
            type="button"
            variant={newApiKeyInput.trim() ? "primary" : "ghost"}
            size="md"
            onClick={() => handleAddApiKeyItem()}
            disabled={!newApiKeyInput.trim()}
          >
            Add
          </Button>
        </div>

        {/* ITEMS LIST */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            maxHeight: "240px",
            overflowY: "auto"
          }}
        >
          {apiKeyList.map((keyItem, index) => {
            const isRevealed = Boolean(revealedIndices[index]);
            return (
              <div
                key={index}
                style={{
                  background: "var(--background)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md, 8px)",
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px"
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    fontFamily: "var(--font-mono)",
                    color: "var(--foreground)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flexGrow: 1
                  }}
                  title={isRevealed ? keyItem : "Masked API key"}
                >
                  {isRevealed ? keyItem : maskApiKey(keyItem)}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleReveal(index)}
                    title={isRevealed ? "Mask key" : "Reveal key"}
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {isRevealed ? (
                      <EyeOff style={{ width: "16px", height: "16px" }} />
                    ) : (
                      <Eye style={{ width: "16px", height: "16px" }} />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveApiKeyItem(index)}
                    style={{
                      color: "var(--destructive, #ef4444)"
                    }}
                    title="Remove key"
                  >
                    <Trash2 style={{ width: "16px", height: "16px" }} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
