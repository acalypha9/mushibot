"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { Ban, Plus } from "lucide-react";
import { splitPhoneNumber, combinePhoneNumber } from "@/lib/countryCodes";
import { ChannelItem, WaGroupItem } from "../types";
import GroupPickerPopover from "./GroupPickerPopover";
import RecipientBadgeItem from "./RecipientBadgeItem";
import RecipientInlineInput from "./RecipientInlineInput";

export interface BlacklistManagerProps {
  selectedChannel: ChannelItem;
  cfgBlacklistList: string[];
  setCfgBlacklistList: (fn: string[] | ((prev: string[]) => string[])) => void;
  editingBlacklistIdx: number | null;
  setEditingBlacklistIdx: (idx: number | null) => void;
  channelCountryCode: string;
  setChannelCountryCode: (code: string) => void;
  waGroups: WaGroupItem[];
  loadingWaGroups: boolean;
  showBlGroupPicker: boolean;
  setShowBlGroupPicker: (show: boolean) => void;
  fetchWaGroups: (chanId?: string, force?: boolean) => Promise<void>;
  blGroupPickerRef: React.RefObject<HTMLDivElement | null>;
  getRecipientDisplayInfo: (recItem: string) => { title: string; subtitle: string | null; isGroup: boolean };
}

export default function BlacklistManager({
  selectedChannel,
  cfgBlacklistList,
  setCfgBlacklistList,
  editingBlacklistIdx,
  setEditingBlacklistIdx,
  channelCountryCode,
  setChannelCountryCode,
  waGroups,
  loadingWaGroups,
  showBlGroupPicker,
  setShowBlGroupPicker,
  fetchWaGroups,
  blGroupPickerRef,
  getRecipientDisplayInfo,
}: BlacklistManagerProps) {
  const commitEntry = (idx: number) => {
    const raw = cfgBlacklistList[idx] || "";
    const formatted = combinePhoneNumber(raw, channelCountryCode);
    if (!formatted.trim()) {
      setCfgBlacklistList((prev) => prev.filter((_, i) => i !== idx));
    } else {
      setCfgBlacklistList((prev) => {
        const next = [...prev];
        next[idx] = formatted.trim();
        return next;
      });
    }
    setEditingBlacklistIdx(null);
  };

  return (
    <div style={{ marginTop: "4px", display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <label style={{ fontSize: "11.5px", fontWeight: "600", color: "#605e5c", display: "flex", alignItems: "center", gap: "4px" }}>
          <Ban style={{ width: "13px", height: "13px", color: "#a4262c" }} />
          <span>Blacklist / Exclude Recipients</span>
        </label>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {selectedChannel?.type === "WHATSAPP" && (
            <GroupPickerPopover
              title="Blacklist WhatsApp Group"
              buttonText="Select Group"
              buttonVariant="outline"
              accentColor="#a4262c"
              containerRef={blGroupPickerRef}
              isOpen={showBlGroupPicker}
              onToggle={() => {
                if (!showBlGroupPicker) {
                  fetchWaGroups(selectedChannel?.id, true);
                }
                setShowBlGroupPicker(!showBlGroupPicker);
              }}
              onClose={() => setShowBlGroupPicker(false)}
              onRefresh={() => fetchWaGroups(selectedChannel?.id, true)}
              loading={loadingWaGroups}
              groups={waGroups}
              onSelectGroup={(groupId) => {
                setCfgBlacklistList((prev) => {
                  const clean = prev.filter((x) => x.trim());
                  if (!clean.includes(groupId)) {
                    return [...clean, groupId];
                  }
                  return clean;
                });
                setShowBlGroupPicker(false);
              }}
            />
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setChannelCountryCode("");
              setCfgBlacklistList((prev) => {
                const clean = prev.filter((x) => x.trim());
                const next = [...clean, ""];
                setEditingBlacklistIdx(next.length - 1);
                return next;
              });
            }}
          >
            <Plus style={{ width: "10px", height: "10px" }} />
            <span>Add Blacklist</span>
          </Button>
        </div>
      </div>

      {cfgBlacklistList.length === 0 && editingBlacklistIdx === null ? (
        <div style={{ fontSize: "11px", color: "#8a8886", fontStyle: "italic", padding: "4px 6px" }}>
          No recipients blacklisted. All will receive automated replies.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
            {cfgBlacklistList.map((blItem, idx) => {
              if (editingBlacklistIdx === idx || !blItem.trim()) return null;
              const info = getRecipientDisplayInfo(blItem);
              return (
                <RecipientBadgeItem
                  key={idx}
                  idx={idx}
                  title={info.title}
                  subtitle={info.subtitle}
                  bg="#a4262c"
                  subtitleColor="#fee2e2"
                  onSelect={() => {
                    const { countryCode: detectedCode, localNumber } = splitPhoneNumber(blItem);
                    setChannelCountryCode(detectedCode);
                    setCfgBlacklistList((prev) => {
                      const next = [...prev];
                      next[idx] = localNumber;
                      return next;
                    });
                    setEditingBlacklistIdx(idx);
                  }}
                  onRemove={() => {
                    setCfgBlacklistList((prev) => prev.filter((_, i) => i !== idx));
                    if (editingBlacklistIdx === idx) setEditingBlacklistIdx(null);
                  }}
                />
              );
            })}
          </div>

          {editingBlacklistIdx !== null && (
            <RecipientInlineInput
              channelType={selectedChannel?.type}
              channelCountryCode={channelCountryCode}
              setChannelCountryCode={setChannelCountryCode}
              value={cfgBlacklistList[editingBlacklistIdx] ?? ""}
              accentColor="#a4262c"
              buttonVariant="danger"
              onChange={(newCode, newLocal) => {
                if (newCode !== channelCountryCode) {
                  setChannelCountryCode(newCode);
                }
                setCfgBlacklistList((prev) => {
                  const next = [...prev];
                  next[editingBlacklistIdx!] = newLocal;
                  return next;
                });
              }}
              onDone={() => commitEntry(editingBlacklistIdx)}
            />
          )}
        </div>
      )}
    </div>
  );
}
