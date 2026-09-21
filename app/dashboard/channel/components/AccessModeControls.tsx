"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { ShieldCheck, Radio, User, Users, Plus } from "lucide-react";
import { ChannelItem, WaGroupItem } from "../types";
import { togglePrivateGroupAccess } from "./messageLimitsLogic";
import GroupPickerPopover from "./GroupPickerPopover";

export interface AccessModeControlsProps {
  selectedChannel: ChannelItem;
  cfgReplyMode: "all" | "specific";
  setCfgReplyMode: (mode: "all" | "specific") => void;
  cfgAllowPrivate: boolean;
  setCfgAllowPrivate: (allow: boolean) => void;
  cfgAllowGroup: boolean;
  setCfgAllowGroup: (allow: boolean) => void;
  cfgWhitelistList: string[];
  setCfgWhitelistList: (fn: string[] | ((prev: string[]) => string[])) => void;
  setEditingWhitelistIdx: (idx: number | null) => void;
  setChannelCountryCode: (code: string) => void;
  cfgCommandPrefix: string;
  setCfgCommandPrefix: (prefix: string) => void;
  waGroups: WaGroupItem[];
  loadingWaGroups: boolean;
  showGroupPicker: boolean;
  setShowGroupPicker: (show: boolean) => void;
  fetchWaGroups: (chanId?: string, force?: boolean) => Promise<void>;
  groupPickerRef: React.RefObject<HTMLDivElement | null>;
}

export default function AccessModeControls({
  selectedChannel,
  cfgReplyMode,
  setCfgReplyMode,
  cfgAllowPrivate,
  setCfgAllowPrivate,
  cfgAllowGroup,
  setCfgAllowGroup,
  cfgWhitelistList,
  setCfgWhitelistList,
  setEditingWhitelistIdx,
  setChannelCountryCode,
  cfgCommandPrefix,
  setCfgCommandPrefix,
  waGroups,
  loadingWaGroups,
  showGroupPicker,
  setShowGroupPicker,
  fetchWaGroups,
  groupPickerRef,
}: AccessModeControlsProps) {
  const handleToggleMode = () => {
    if (cfgReplyMode === "all") {
      setCfgReplyMode("specific");
      if (cfgWhitelistList.length === 0) {
        setCfgWhitelistList([""]);
        setEditingWhitelistIdx(0);
      }
    } else {
      setCfgReplyMode("all");
      setEditingWhitelistIdx(null);
    }
  };

  const handleTogglePrivate = () => {
    const updated = togglePrivateGroupAccess("private", {
      allowPrivate: cfgAllowPrivate,
      allowGroup: cfgAllowGroup,
    });
    setCfgAllowPrivate(updated.allowPrivate);
  };

  const handleToggleGroup = () => {
    const updated = togglePrivateGroupAccess("group", {
      allowPrivate: cfgAllowPrivate,
      allowGroup: cfgAllowGroup,
    });
    setCfgAllowGroup(updated.allowGroup);
  };

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <label style={{ fontSize: "12px", fontWeight: "bold", textTransform: "uppercase", color: "var(--foreground)", display: "flex", alignItems: "center", gap: "6px" }}>
            <ShieldCheck style={{ width: "15px", height: "15px", color: "var(--primary)" }} />
            <span>Access Control & Target Recipients</span>
          </label>

          <Button
            type="button"
            variant={cfgReplyMode === "all" ? "primary" : "ghost"}
            size="sm"
            onClick={handleToggleMode}
          >
            <Radio style={{ width: "12px", height: "12px" }} />
            <span>Reply All</span>
          </Button>
        </div>

        <span style={{ fontSize: "11px", color: "var(--muted-foreground)", display: "block", marginTop: "3px" }}>
          Control which numbers or groups the AI bot is allowed to automatically reply to
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {cfgReplyMode === "all" ? (
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <Button
              type="button"
              variant={cfgAllowPrivate ? "primary" : "ghost"}
              size="sm"
              onClick={handleTogglePrivate}
              title={cfgAllowPrivate ? "Private (1-on-1) messages will be replied" : "Private messages will be ignored"}
            >
              <User style={{ width: "12px", height: "12px" }} />
              <span>Private</span>
            </Button>

            <Button
              type="button"
              variant={cfgAllowGroup ? "primary" : "ghost"}
              size="sm"
              onClick={handleToggleGroup}
              title={cfgAllowGroup ? "Group messages will be replied" : "Group messages will be ignored"}
            >
              <Users style={{ width: "12px", height: "12px" }} />
              <span>Group</span>
            </Button>
          </div>
        ) : (
          <>
            {selectedChannel?.type === "WHATSAPP" && (
              <GroupPickerPopover
                title="Joined WhatsApp Groups"
                buttonText="Select Group"
                buttonVariant="outline"
                accentColor="#742774"
                containerRef={groupPickerRef}
                isOpen={showGroupPicker}
                onToggle={() => {
                  if (!showGroupPicker) {
                    fetchWaGroups(selectedChannel?.id, true);
                  }
                  setShowGroupPicker(!showGroupPicker);
                }}
                onClose={() => setShowGroupPicker(false)}
                onRefresh={() => fetchWaGroups(selectedChannel?.id, true)}
                loading={loadingWaGroups}
                groups={waGroups}
                onSelectGroup={(groupId) => {
                  setCfgWhitelistList((prev) => {
                    const clean = prev.filter((x) => x.trim());
                    if (!clean.includes(groupId)) {
                      return [...clean, groupId];
                    }
                    return clean;
                  });
                  if (!cfgCommandPrefix.trim()) {
                    setCfgCommandPrefix(".ai");
                  }
                  setShowGroupPicker(false);
                }}
              />
            )}

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                setChannelCountryCode("");
                setCfgWhitelistList((prev) => {
                  const next = [...prev, ""];
                  setEditingWhitelistIdx(next.length - 1);
                  return next;
                });
              }}
            >
              <Plus style={{ width: "13px", height: "13px" }} />
              <span>Add Whitelist</span>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
