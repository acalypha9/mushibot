"use client";

import React, { useRef, useEffect } from "react";
import { ChannelItem, WaGroupItem } from "../types";
import MessageLimitsHeader from "./MessageLimitsHeader";
import RateLimitsForm from "./RateLimitsForm";
import AccessModeControls from "./AccessModeControls";
import WhitelistManager from "./WhitelistManager";
import BlacklistManager from "./BlacklistManager";
import CommandPrefixConfig from "./CommandPrefixConfig";
import { computeHasGroupsSelected } from "./messageLimitsLogic";

export interface MessageLimitsTabProps {
  selectedChannel: ChannelItem;
  onSaveAllConfig: (e?: React.FormEvent) => void;
  hasUnsavedMessageChanges: boolean;
  isSaved: boolean;
  cfgRateLimit: number;
  setCfgRateLimit: (val: number) => void;
  cfgMaxTokens: number;
  setCfgMaxTokens: (val: number) => void;
  cfgTimeout: number;
  setCfgTimeout: (val: number) => void;
  cfgSessionTimeout: number;
  setCfgSessionTimeout: (val: number) => void;
  cfgTypingDelay: number;
  setCfgTypingDelay: (val: number) => void;
  cfgReplyMode: "all" | "specific";
  setCfgReplyMode: (mode: "all" | "specific") => void;
  cfgAllowPrivate: boolean;
  setCfgAllowPrivate: (allow: boolean) => void;
  cfgAllowGroup: boolean;
  setCfgAllowGroup: (allow: boolean) => void;
  cfgCommandPrefix: string;
  setCfgCommandPrefix: (prefix: string) => void;
  cfgWhitelistList: string[];
  setCfgWhitelistList: (fn: string[] | ((prev: string[]) => string[])) => void;
  cfgBlacklistList: string[];
  setCfgBlacklistList: (fn: string[] | ((prev: string[]) => string[])) => void;
  editingWhitelistIdx: number | null;
  setEditingWhitelistIdx: (idx: number | null) => void;
  editingBlacklistIdx: number | null;
  setEditingBlacklistIdx: (idx: number | null) => void;
  channelCountryCode: string;
  setChannelCountryCode: (code: string) => void;
  waGroups: WaGroupItem[];
  loadingWaGroups: boolean;
  showGroupPicker: boolean;
  setShowGroupPicker: (show: boolean) => void;
  showBlGroupPicker: boolean;
  setShowBlGroupPicker: (show: boolean) => void;
  fetchWaGroups: (chanId?: string) => Promise<void>;
  getRecipientDisplayInfo: (recItem: string) => { title: string; subtitle: string | null; isGroup: boolean };
}

export default function MessageLimitsTab({
  selectedChannel,
  onSaveAllConfig,
  hasUnsavedMessageChanges,
  isSaved,
  cfgRateLimit,
  setCfgRateLimit,
  cfgMaxTokens,
  setCfgMaxTokens,
  cfgTimeout,
  setCfgTimeout,
  cfgSessionTimeout,
  setCfgSessionTimeout,
  cfgTypingDelay,
  setCfgTypingDelay,
  cfgReplyMode,
  setCfgReplyMode,
  cfgAllowPrivate,
  setCfgAllowPrivate,
  cfgAllowGroup,
  setCfgAllowGroup,
  cfgCommandPrefix,
  setCfgCommandPrefix,
  cfgWhitelistList,
  setCfgWhitelistList,
  cfgBlacklistList,
  setCfgBlacklistList,
  editingWhitelistIdx,
  setEditingWhitelistIdx,
  editingBlacklistIdx,
  setEditingBlacklistIdx,
  channelCountryCode,
  setChannelCountryCode,
  waGroups,
  loadingWaGroups,
  showGroupPicker,
  setShowGroupPicker,
  showBlGroupPicker,
  setShowBlGroupPicker,
  fetchWaGroups,
  getRecipientDisplayInfo,
}: MessageLimitsTabProps) {
  const groupPickerRef = useRef<HTMLDivElement>(null);
  const blGroupPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (groupPickerRef.current && !groupPickerRef.current.contains(e.target as Node)) {
        setShowGroupPicker(false);
      }
      if (blGroupPickerRef.current && !blGroupPickerRef.current.contains(e.target as Node)) {
        setShowBlGroupPicker(false);
      }
    }
    if (showGroupPicker || showBlGroupPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showGroupPicker, showBlGroupPicker, setShowGroupPicker, setShowBlGroupPicker]);

  const hasGroupsSelected = computeHasGroupsSelected({
    allowGroup: cfgAllowGroup,
    replyMode: cfgReplyMode,
    whitelistList: cfgWhitelistList,
    channelType: selectedChannel?.type,
  });

  return (
    <form
      onSubmit={onSaveAllConfig}
      style={{
        background: "#ffffff",
        border: "1px solid #e1dfdd",
        borderRadius: "8px",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "18px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <MessageLimitsHeader hasUnsavedMessageChanges={hasUnsavedMessageChanges} isSaved={isSaved} />

      <RateLimitsForm
        cfgRateLimit={cfgRateLimit}
        setCfgRateLimit={setCfgRateLimit}
        cfgMaxTokens={cfgMaxTokens}
        setCfgMaxTokens={setCfgMaxTokens}
        cfgTimeout={cfgTimeout}
        setCfgTimeout={setCfgTimeout}
        cfgSessionTimeout={cfgSessionTimeout}
        setCfgSessionTimeout={setCfgSessionTimeout}
        cfgTypingDelay={cfgTypingDelay}
        setCfgTypingDelay={setCfgTypingDelay}
      />

      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
        <AccessModeControls
          selectedChannel={selectedChannel}
          cfgReplyMode={cfgReplyMode}
          setCfgReplyMode={setCfgReplyMode}
          cfgAllowPrivate={cfgAllowPrivate}
          setCfgAllowPrivate={setCfgAllowPrivate}
          cfgAllowGroup={cfgAllowGroup}
          setCfgAllowGroup={setCfgAllowGroup}
          cfgWhitelistList={cfgWhitelistList}
          setCfgWhitelistList={setCfgWhitelistList}
          setEditingWhitelistIdx={setEditingWhitelistIdx}
          setChannelCountryCode={setChannelCountryCode}
          cfgCommandPrefix={cfgCommandPrefix}
          setCfgCommandPrefix={setCfgCommandPrefix}
          waGroups={waGroups}
          loadingWaGroups={loadingWaGroups}
          showGroupPicker={showGroupPicker}
          setShowGroupPicker={setShowGroupPicker}
          fetchWaGroups={fetchWaGroups}
          groupPickerRef={groupPickerRef}
        />

        {cfgReplyMode === "all" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "8px",
                background: "#f5eef5",
                border: "1px solid #e4d3e4",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "12.5px",
                color: "#5c1b5c",
              }}
            >
              <span style={{ fontWeight: "normal" }}>
                {cfgAllowPrivate && cfgAllowGroup ? (
                  <>
                    <strong>Reply to All:</strong> The AI bot will automatically reply to all incoming messages from contacts (private) and groups on this channel, except those listed in the Blacklist below.
                  </>
                ) : cfgAllowPrivate ? (
                  <>
                    <strong>Reply to Private Only:</strong> The AI bot will automatically reply to <strong>private (1-on-1) messages only</strong>. Group messages will be ignored.
                  </>
                ) : (
                  <>
                    <strong>Reply to Group Only:</strong> The AI bot will automatically reply to <strong>group messages only</strong>. Private messages will be ignored.
                  </>
                )}
              </span>
            </div>

            <BlacklistManager
              selectedChannel={selectedChannel}
              cfgBlacklistList={cfgBlacklistList}
              setCfgBlacklistList={setCfgBlacklistList}
              editingBlacklistIdx={editingBlacklistIdx}
              setEditingBlacklistIdx={setEditingBlacklistIdx}
              channelCountryCode={channelCountryCode}
              setChannelCountryCode={setChannelCountryCode}
              waGroups={waGroups}
              loadingWaGroups={loadingWaGroups}
              showBlGroupPicker={showBlGroupPicker}
              setShowBlGroupPicker={setShowBlGroupPicker}
              fetchWaGroups={fetchWaGroups}
              blGroupPickerRef={blGroupPickerRef}
              getRecipientDisplayInfo={getRecipientDisplayInfo}
            />
          </div>
        ) : (
          <WhitelistManager
            selectedChannel={selectedChannel}
            cfgWhitelistList={cfgWhitelistList}
            setCfgWhitelistList={setCfgWhitelistList}
            editingWhitelistIdx={editingWhitelistIdx}
            setEditingWhitelistIdx={setEditingWhitelistIdx}
            channelCountryCode={channelCountryCode}
            setChannelCountryCode={setChannelCountryCode}
            cfgCommandPrefix={cfgCommandPrefix}
            setCfgCommandPrefix={setCfgCommandPrefix}
            getRecipientDisplayInfo={getRecipientDisplayInfo}
          />
        )}

        <CommandPrefixConfig
          hasGroupsSelected={hasGroupsSelected}
          cfgCommandPrefix={cfgCommandPrefix}
          setCfgCommandPrefix={setCfgCommandPrefix}
        />
      </div>
    </form>
  );
}
