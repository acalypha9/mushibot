"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { X } from "lucide-react";
import {
  CountryCodePicker,
  splitPhoneNumber,
  extractCountryCodeFromInput,
} from "@/lib/countryCodes";
import type { WaGroupItem } from "../../types";
import { normalizeRecipientId } from "./reminderFormLogic";

export interface RecipientBadgesAndEditorProps {
  channelType: "WHATSAPP" | "TELEGRAM";
  recipientList: string[];
  setRecipientList: React.Dispatch<React.SetStateAction<string[]>>;
  editingIdx: number | null;
  setEditingIdx: (val: number | null) => void;
  countryCode: string;
  setCountryCode: (val: string) => void;
  getDisplayInfo: (item: string) => { title: string; subtitle: string | null; isGroup: boolean };
  waGroups?: WaGroupItem[];
}

export function RecipientBadgesAndEditor({
  channelType,
  recipientList,
  setRecipientList,
  editingIdx,
  setEditingIdx,
  countryCode,
  setCountryCode,
  getDisplayInfo,
  waGroups = [],
}: RecipientBadgesAndEditorProps) {
  const commit = () => {
    if (editingIdx === null) return;
    const raw = recipientList[editingIdx] || "";
    const formatted = normalizeRecipientId(raw, channelType, waGroups, countryCode);
    if (formatted.trim()) {
      setRecipientList((prev) => {
        const next = [...prev];
        next[editingIdx] = formatted.trim();
        return next;
      });
    } else {
      setRecipientList((prev) => prev.filter((_, i) => i !== editingIdx));
    }
    setEditingIdx(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
        {recipientList.map((recItem, idx) => {
          if (editingIdx === idx || !recItem.trim()) return null;
          const info = getDisplayInfo(recItem);
          return (
            <div
              key={idx}
              onClick={() => {
                const { countryCode: detectedCode, localNumber } = splitPhoneNumber(recItem);
                setCountryCode(detectedCode);
                setRecipientList((prev) => {
                  const next = [...prev];
                  next[idx] = localNumber;
                  return next;
                });
                setEditingIdx(idx);
              }}
              style={{
                display: "inline-flex", alignItems: "center", gap: "10px", padding: info.subtitle ? "6px 12px" : "6px 14px",
                borderRadius: "6px", background: "#742774", color: "#ffffff", cursor: "pointer",
                boxShadow: "0 1px 3px rgba(116, 39, 116, 0.2)", transition: "opacity 0.15s ease",
              }}
              title="Click number to edit"
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: "1.25" }}>
                <span style={{ fontSize: "12.5px", fontWeight: "700", color: "#ffffff" }}>{info.title}</span>
                {info.subtitle && <span style={{ fontSize: "10px", color: "#f3e8f3", fontFamily: "var(--font-mono)", opacity: 0.9, marginTop: "2px" }}>{info.subtitle}</span>}
              </div>
              <Button
                type="button" variant="ghost" size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setRecipientList((prev) => prev.filter((_, i) => i !== idx));
                  if (editingIdx === idx) setEditingIdx(null);
                }}
                style={{
                  background: "rgba(255, 255, 255, 0.25)", borderRadius: "50%", width: "16px", height: "16px",
                  color: "#ffffff", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}
                title="Remove"
              >
                <X style={{ width: "10px", height: "10px", color: "#ffffff" }} />
              </Button>
            </div>
          );
        })}
      </div>

      {editingIdx !== null ? (
        <div
          style={{
            display: "flex", alignItems: "center", width: "100%", borderRadius: "8px",
            border: "1.5px solid #742774", background: "#ffffff", boxShadow: "0 0 0 3px rgba(116, 39, 116, 0.12)",
            boxSizing: "border-box", overflow: "visible",
          }}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) commit();
          }}
        >
          {channelType === "WHATSAPP" && (
            <>
              <CountryCodePicker value={countryCode} onChange={(val) => setCountryCode(val)} accentColor="#742774" />
              <div style={{ width: "1px", height: "22px", background: "#edebe9", flexShrink: 0 }} />
            </>
          )}
          <Input
            autoFocus type="text"
            value={recipientList[editingIdx] ?? ""}
            onChange={(e) => {
              const rawInput = e.target.value;
              const { countryCode: newCode, localNumber: cleanedLocal, hasChanged } = extractCountryCodeFromInput(rawInput, countryCode);
              if (hasChanged && newCode !== countryCode) setCountryCode(newCode);
              setRecipientList((prev) => {
                const next = [...prev];
                next[editingIdx] = hasChanged ? cleanedLocal : rawInput;
                return next;
              });
            }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commit(); } }}
            placeholder={channelType === "WHATSAPP" ? "8123... or ...@g.us" : "@username or Chat ID"}
            style={{ flex: 1, border: "none", outline: "none", background: "transparent" }}
          />
          <div style={{ paddingRight: "5px", flexShrink: 0 }}>
            <Button type="button" variant="primary" size="sm" onMouseDown={(e) => e.preventDefault()} onClick={commit}>
              Done
            </Button>
          </div>
        </div>
      ) : recipientList.filter((x) => x.trim()).length === 0 ? (
        <div style={{ padding: "10px 12px", borderRadius: "6px", background: "#ffffff", border: "1px dashed #d1d5db", textAlign: "center", fontSize: "12px", color: "#605e5c" }}>
          No recipients added yet. Click <strong>&quot;Add Recipient&quot;</strong> or <strong>&quot;Set All&quot;</strong>.
        </div>
      ) : null}

      {recipientList.filter((x) => x.trim()).length > 0 && (
        <div style={{ fontSize: "11px", color: "#605e5c", marginTop: "2px" }}>Click any number to edit it.</div>
      )}
    </div>
  );
}
