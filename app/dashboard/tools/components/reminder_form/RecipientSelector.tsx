"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import {
  Send, Users, Radio, User, Plus,
} from "lucide-react";
import type { ChannelOption, WaGroupItem } from "../../types";
import { GroupPickerPopover } from "./GroupPickerPopover";
import { RecipientBadgesAndEditor } from "./RecipientBadgesAndEditor";

export interface RecipientSelectorProps {
  reminderChannelTypeInput: "WHATSAPP" | "TELEGRAM";
  setReminderChannelTypeInput: (val: "WHATSAPP" | "TELEGRAM") => void;
  reminderChannelIdInput: string;
  setReminderChannelIdInput: (val: string) => void;
  availableChannels: ChannelOption[];
  reminderRecipientMode: "specific" | "all";
  setReminderRecipientMode: (val: "specific" | "all") => void;
  reminderAllowPrivate: boolean;
  setReminderAllowPrivate: (val: boolean) => void;
  reminderAllowGroup: boolean;
  setReminderAllowGroup: (val: boolean) => void;
  groupPickerRef: React.RefObject<HTMLDivElement | null>;
  showGroupPicker: boolean;
  setShowGroupPicker: (val: boolean) => void;
  fetchWaGroups: (channelIdOrForce?: string | boolean, force?: boolean) => Promise<void>;
  loadingWaGroups: boolean;
  waGroups: WaGroupItem[];
  reminderRecipientList: string[];
  setReminderRecipientList: React.Dispatch<React.SetStateAction<string[]>>;
  editingRecipientIdx: number | null;
  setEditingRecipientIdx: (val: number | null) => void;
  reminderCountryCode: string;
  setReminderCountryCode: (val: string) => void;
  getRecipientDisplayInfo: (item: string) => { title: string; subtitle: string | null; isGroup: boolean };
  blacklistSlot?: React.ReactNode;
}

export function RecipientSelector(props: RecipientSelectorProps) {
  const {
    reminderChannelTypeInput, setReminderChannelTypeInput,
    reminderChannelIdInput, setReminderChannelIdInput,
    availableChannels, reminderRecipientMode, setReminderRecipientMode,
    reminderAllowPrivate, setReminderAllowPrivate,
    reminderAllowGroup, setReminderAllowGroup,
    groupPickerRef, showGroupPicker, setShowGroupPicker,
    fetchWaGroups, loadingWaGroups, waGroups,
    reminderRecipientList, setReminderRecipientList,
    editingRecipientIdx, setEditingRecipientIdx,
    reminderCountryCode, setReminderCountryCode,
    getRecipientDisplayInfo, blacklistSlot,
  } = props;

  const handleSelectGroup = (groupId: string) => {
    setReminderRecipientList((prev) => {
      const clean = prev.filter((x) => x.trim());
      return clean.includes(groupId) ? clean : [...clean, groupId];
    });
    setShowGroupPicker(false);
  };

  return (
    <div style={{
      padding: "16px", borderRadius: "8px", background: "#faf9f8",
      border: "1px solid #edebe9", display: "flex", flexDirection: "column", gap: "14px",
    }}>
      <div style={{ fontSize: "13px", fontWeight: "700", color: "#323130", display: "flex", alignItems: "center", gap: "8px" }}>
        <Send style={{ width: "16px", height: "16px", color: "#742774" }} />
        <span>Target Delivery Channel</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#605e5c", marginBottom: "4px" }}>
            Delivery Channel <span style={{ color: "#a4262c" }}>*</span>
          </label>
          <Select
            value={reminderChannelTypeInput}
            onChange={(e) => {
              const newType = e.target.value as "WHATSAPP" | "TELEGRAM";
              setReminderChannelTypeInput(newType);
              const matching = availableChannels.filter((c) => c.type === newType);
              const nextId = matching.length > 0 ? matching[0].id : "default";
              setReminderChannelIdInput(nextId);
              if (newType === "WHATSAPP") {
                void fetchWaGroups(nextId);
              }
            }}
          >
            <option value="WHATSAPP">WhatsApp</option>
            <option value="TELEGRAM">Telegram</option>
          </Select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#605e5c", marginBottom: "4px" }}>Channel Account / Session</label>
          <Select
            value={reminderChannelIdInput}
            onChange={(e) => {
              const nextId = e.target.value;
              setReminderChannelIdInput(nextId);
              if (reminderChannelTypeInput === "WHATSAPP") {
                void fetchWaGroups(nextId);
              }
            }}
          >
            {availableChannels.filter((c) => c.type === reminderChannelTypeInput).length > 0 ? (
              availableChannels.filter((c) => c.type === reminderChannelTypeInput).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))
            ) : (
              <option value="default">{reminderChannelTypeInput === "WHATSAPP" ? "WhatsApp Channel" : "Telegram Bot"}</option>
            )}
          </Select>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <label style={{ fontSize: "12px", fontWeight: "600", color: "#605e5c", display: "flex", alignItems: "center", gap: "6px" }}>
              <Users style={{ width: "14px", height: "14px", color: "#742774" }} />
              <span>Target Recipients</span>
            </label>
            <Button
              type="button" variant={reminderRecipientMode === "all" ? "primary" : "ghost"} size="sm"
              onClick={() => setReminderRecipientMode(reminderRecipientMode === "all" ? "specific" : "all")}
              style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
            >
              <Radio style={{ width: "12px", height: "12px" }} />
              <span>Set All</span>
            </Button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {reminderRecipientMode === "all" ? (
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <Button
                  type="button" variant={reminderAllowPrivate ? "primary" : "ghost"} size="sm"
                  onClick={() => { if (reminderAllowPrivate && !reminderAllowGroup) return; setReminderAllowPrivate(!reminderAllowPrivate); }}
                  style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                  title={reminderAllowPrivate ? "Private contacts will receive reminder" : "Private contacts will be excluded"}
                >
                  <User style={{ width: "12px", height: "12px" }} />
                  <span>Private</span>
                </Button>
                <Button
                  type="button" variant={reminderAllowGroup ? "primary" : "ghost"} size="sm"
                  onClick={() => { if (reminderAllowGroup && !reminderAllowPrivate) return; setReminderAllowGroup(!reminderAllowGroup); }}
                  style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                  title={reminderAllowGroup ? "Groups will receive reminder" : "Groups will be excluded"}
                >
                  <Users style={{ width: "12px", height: "12px" }} />
                  <span>Group</span>
                </Button>
              </div>
            ) : (
              <>
                {reminderChannelTypeInput === "WHATSAPP" && (
                  <GroupPickerPopover
                    groupPickerRef={groupPickerRef}
                    showGroupPicker={showGroupPicker}
                    setShowGroupPicker={setShowGroupPicker}
                    fetchWaGroups={fetchWaGroups}
                    loadingWaGroups={loadingWaGroups}
                    waGroups={waGroups}
                    onSelectGroup={handleSelectGroup}
                    channelId={reminderChannelIdInput}
                  />
                )}
                <Button
                  type="button" variant="primary" size="sm"
                  onClick={() => {
                    setReminderCountryCode("");
                    setReminderRecipientList((prev) => { const next = [...prev, ""]; setEditingRecipientIdx(next.length - 1); return next; });
                  }}
                  style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                  title="Add Recipient"
                >
                  <Plus style={{ width: "12px", height: "12px" }} />
                  <span>Add Recipient</span>
                </Button>
              </>
            )}
          </div>
        </div>

        {reminderRecipientMode === "all" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ padding: "10px 12px", borderRadius: "6px", background: "#f5eef5", border: "1px solid #e4d3e4", display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#5c1b5c" }}>
              <Users style={{ width: "16px", height: "16px", color: "#742774", flexShrink: 0 }} />
              <span>
                {reminderAllowPrivate && reminderAllowGroup ? (
                  <><strong>Send to All:</strong> Broadcast to all contacts (private) and groups on the selected {reminderChannelTypeInput === "WHATSAPP" ? "WhatsApp session" : "Telegram channel"}.</>
                ) : reminderAllowPrivate ? (
                  <><strong>Send to Private Only:</strong> Broadcast to <strong>all private contacts only</strong> on the selected {reminderChannelTypeInput === "WHATSAPP" ? "WhatsApp session" : "Telegram channel"}.</>
                ) : (
                  <><strong>Send to Groups Only:</strong> Broadcast to <strong>all groups only</strong> on the selected {reminderChannelTypeInput === "WHATSAPP" ? "WhatsApp session" : "Telegram channel"}.</>
                )}
              </span>
            </div>
            {blacklistSlot}
          </div>
        ) : (
          <RecipientBadgesAndEditor
            channelType={reminderChannelTypeInput}
            recipientList={reminderRecipientList}
            setRecipientList={setReminderRecipientList}
            editingIdx={editingRecipientIdx}
            setEditingIdx={setEditingRecipientIdx}
            countryCode={reminderCountryCode}
            setCountryCode={setReminderCountryCode}
            getDisplayInfo={getRecipientDisplayInfo}
            waGroups={waGroups}
          />
        )}
      </div>
    </div>
  );
}
