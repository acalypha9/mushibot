"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Users, Ban, X, Plus } from "lucide-react";
import type { WaGroupItem } from "../../types";
import {
  CountryCodePicker,
  splitPhoneNumber,
  extractCountryCodeFromInput,
  combinePhoneNumber,
} from "@/lib/countryCodes";

export interface BlacklistConfigProps {
  channelType: "WHATSAPP" | "TELEGRAM";
  blacklistList: string[];
  setBlacklistList: React.Dispatch<React.SetStateAction<string[]>>;
  editingIdx: number | null;
  setEditingIdx: (val: number | null) => void;
  countryCode: string;
  setCountryCode: (val: string) => void;
  blGroupPickerRef: React.RefObject<HTMLDivElement | null>;
  showBlGroupPicker: boolean;
  setShowBlGroupPicker: (val: boolean) => void;
  fetchWaGroups: (force?: boolean) => Promise<void>;
  waGroups: WaGroupItem[];
  getDisplayInfo: (item: string) => { title: string; subtitle: string | null; isGroup: boolean };
}

export function BlacklistConfig({
  channelType, blacklistList, setBlacklistList,
  editingIdx, setEditingIdx, countryCode, setCountryCode,
  blGroupPickerRef, showBlGroupPicker, setShowBlGroupPicker,
  fetchWaGroups, waGroups, getDisplayInfo,
}: BlacklistConfigProps) {
  const commit = () => {
    if (editingIdx === null) return;
    const raw = blacklistList[editingIdx] || "";
    const formatted = combinePhoneNumber(raw, countryCode);
    if (formatted.trim()) {
      setBlacklistList((prev) => {
        const next = [...prev];
        next[editingIdx] = formatted.trim();
        return next;
      });
    } else {
      setBlacklistList((prev) => prev.filter((_, i) => i !== editingIdx));
    }
    setEditingIdx(null);
  };

  return (
    <div style={{ marginTop: "4px", display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <label style={{ fontSize: "11.5px", fontWeight: "600", color: "#605e5c", display: "flex", alignItems: "center", gap: "4px" }}>
          <Ban style={{ width: "12px", height: "12px", color: "#a4262c" }} />
          <span>Blacklist / Exclude Recipients</span>
        </label>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {channelType === "WHATSAPP" && (
            <div ref={blGroupPickerRef} style={{ position: "relative" }}>
              <Button
                type="button" variant="outline" size="sm"
                onClick={() => { if (!showBlGroupPicker) void fetchWaGroups(true); setShowBlGroupPicker(!showBlGroupPicker); }}
                style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}
                title="Select from your WhatsApp Groups to exclude"
              >
                <Users style={{ width: "10px", height: "10px" }} />
                <span>Select Group</span>
              </Button>
              {showBlGroupPicker && (
                <div style={{
                  position: "absolute", right: 0, top: "100%", marginTop: "6px", width: "260px",
                  maxHeight: "220px", overflowY: "auto", background: "#ffffff", borderRadius: "8px",
                  border: "1px solid #e1dfdd", boxShadow: "0 8px 24px rgba(0,0,0,0.15)", zIndex: 1000, padding: "8px",
                }}>
                  <div style={{ fontSize: "11px", fontWeight: "700", color: "#323130", padding: "4px 6px 6px", borderBottom: "1px solid #f3f2f1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Exclude WhatsApp Group</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowBlGroupPicker(false)} style={{ padding: 0 }}><X style={{ width: "12px", height: "12px" }} /></Button>
                  </div>
                  {waGroups.length === 0 ? (
                    <div style={{ padding: "12px", textAlign: "center", fontSize: "11.5px", color: "#8a8886" }}>No groups found.</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "3px", marginTop: "4px" }}>
                      {waGroups.map((g) => (
                        <Button
                          key={g.id} type="button" variant="ghost"
                          onClick={() => {
                            setBlacklistList((prev) => {
                              const clean = prev.filter((x) => x.trim());
                              return clean.includes(g.id) ? clean : [...clean, g.id];
                            });
                            setShowBlGroupPicker(false);
                          }}
                          style={{ textAlign: "left", padding: "6px 8px", display: "block", width: "100%" }}
                        >
                          <div style={{ fontWeight: "600", fontSize: "11.5px", color: "#323130" }}>{g.subject}</div>
                          <div style={{ fontSize: "10px", color: "#a4262c", fontFamily: "var(--font-mono)" }}>{g.id}</div>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <Button
            type="button" variant="outline" size="sm"
            onClick={() => {
              setCountryCode("");
              setBlacklistList((prev) => { const next = [...prev, ""]; setEditingIdx(next.length - 1); return next; });
            }}
            style={{ display: "inline-flex", alignItems: "center", gap: "3px", color: "#a4262c", borderColor: "#fecaca" }}
            title="Add Blacklist Number"
          >
            <Plus style={{ width: "11px", height: "11px" }} />
            <span>Add Exclude</span>
          </Button>
        </div>
      </div>

      {blacklistList.filter((x) => x.trim()).length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
          {blacklistList.map((blItem, idx) => {
            if (editingIdx === idx || !blItem.trim()) return null;
            const info = getDisplayInfo(blItem);
            return (
              <div
                key={idx}
                onClick={() => {
                  const { countryCode: detectedCode, localNumber } = splitPhoneNumber(blItem);
                  setCountryCode(detectedCode);
                  setBlacklistList((prev) => { const next = [...prev]; next[idx] = localNumber; return next; });
                  setEditingIdx(idx);
                }}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "8px", padding: info.subtitle ? "4px 8px" : "4px 10px",
                  borderRadius: "4px", background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b",
                  fontSize: "11.5px", cursor: "pointer",
                }}
                title="Click number to edit"
              >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: "1.2" }}>
                  <span style={{ fontWeight: "600" }}>{info.title}</span>
                  {info.subtitle && <span style={{ fontSize: "9.5px", color: "#dc2626", fontFamily: "var(--font-mono)" }}>{info.subtitle}</span>}
                </div>
                <Button
                  type="button" variant="ghost" size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setBlacklistList((prev) => prev.filter((_, i) => i !== idx));
                    if (editingIdx === idx) setEditingIdx(null);
                  }}
                  style={{ background: "transparent", borderRadius: "50%", width: "14px", height: "14px", color: "#991b1b", padding: 0 }}
                  title="Remove"
                >
                  <X style={{ width: "10px", height: "10px" }} />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {editingIdx !== null && (
        <div
          style={{
            display: "flex", alignItems: "center", width: "100%", borderRadius: "6px",
            border: "1.5px solid #a4262c", background: "#ffffff", boxShadow: "0 0 0 2px rgba(164, 38, 44, 0.1)",
            boxSizing: "border-box", overflow: "visible",
          }}
          onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) commit(); }}
        >
          {channelType === "WHATSAPP" && (
            <>
              <CountryCodePicker value={countryCode} onChange={(val) => setCountryCode(val)} accentColor="#a4262c" />
              <div style={{ width: "1px", height: "20px", background: "#edebe9", flexShrink: 0 }} />
            </>
          )}
          <Input
            autoFocus type="text"
            value={blacklistList[editingIdx] ?? ""}
            onChange={(e) => {
              const rawInput = e.target.value;
              const { countryCode: newCode, localNumber: cleanedLocal, hasChanged } = extractCountryCodeFromInput(rawInput, countryCode);
              if (hasChanged && newCode !== countryCode) setCountryCode(newCode);
              setBlacklistList((prev) => {
                const next = [...prev];
                next[editingIdx!] = hasChanged ? cleanedLocal : rawInput;
                return next;
              });
            }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commit(); } }}
            placeholder={channelType === "WHATSAPP" ? "8123... or ...@g.us" : "@username or Chat ID"}
            style={{ flex: 1, border: "none", outline: "none", background: "transparent" }}
          />
          <div style={{ paddingRight: "5px", flexShrink: 0 }}>
            <Button type="button" variant="primary" size="sm" onMouseDown={(e) => e.preventDefault()} onClick={commit} style={{ background: "#a4262c", borderColor: "#a4262c" }}>
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
