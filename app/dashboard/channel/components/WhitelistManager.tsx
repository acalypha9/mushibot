"use client";

import React from "react";
import { ShieldCheck, Users } from "lucide-react";
import { splitPhoneNumber, combinePhoneNumber } from "@/lib/countryCodes";
import { ChannelItem } from "../types";
import RecipientBadgeItem from "./RecipientBadgeItem";
import RecipientInlineInput from "./RecipientInlineInput";

export interface WhitelistManagerProps {
  selectedChannel: ChannelItem;
  cfgWhitelistList: string[];
  setCfgWhitelistList: (fn: string[] | ((prev: string[]) => string[])) => void;
  editingWhitelistIdx: number | null;
  setEditingWhitelistIdx: (idx: number | null) => void;
  channelCountryCode: string;
  setChannelCountryCode: (code: string) => void;
  cfgCommandPrefix: string;
  setCfgCommandPrefix: (prefix: string) => void;
  getRecipientDisplayInfo: (recItem: string) => { title: string; subtitle: string | null; isGroup: boolean };
}

export default function WhitelistManager({
  selectedChannel,
  cfgWhitelistList,
  setCfgWhitelistList,
  editingWhitelistIdx,
  setEditingWhitelistIdx,
  channelCountryCode,
  setChannelCountryCode,
  cfgCommandPrefix,
  setCfgCommandPrefix,
  getRecipientDisplayInfo,
}: WhitelistManagerProps) {
  const commitEntry = (idx: number) => {
    const raw = cfgWhitelistList[idx] || "";
    const formatted = combinePhoneNumber(raw, channelCountryCode);
    if (!formatted.trim()) {
      setCfgWhitelistList((prev) => prev.filter((_, i) => i !== idx));
    } else {
      setCfgWhitelistList((prev) => {
        const next = [...prev];
        next[idx] = formatted.trim();
        return next;
      });
      if ((formatted.includes("@g.us") || formatted.startsWith("-")) && !cfgCommandPrefix.trim()) {
        setCfgCommandPrefix(".ai");
      }
    }
    setEditingWhitelistIdx(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div
        style={{
          padding: "10px 14px",
          borderRadius: "8px",
          background: "#faf5fb",
          border: "1px solid #ebd9ec",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          fontSize: "12.5px",
          color: "#5c1b5c",
        }}
      >
        <ShieldCheck style={{ width: "18px", height: "18px", color: "#742774", flexShrink: 0 }} />
        <span>
          <strong>Whitelist Only:</strong> The AI bot will only reply to the specified numbers, JIDs, or groups below. All other incoming messages will be ignored.
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <label style={{ fontSize: "11.5px", fontWeight: "600", color: "#605e5c", display: "flex", alignItems: "center", gap: "4px" }}>
          <Users style={{ width: "12px", height: "12px", color: "#742774" }} />
          <span>Whitelisted Numbers / Groups ({cfgWhitelistList.filter(Boolean).length})</span>
        </label>

        {cfgWhitelistList.filter(Boolean).length === 0 && editingWhitelistIdx === null ? (
          <div style={{ fontSize: "12px", color: "#8a8886", fontStyle: "italic", padding: "6px 8px" }}>
            No whitelisted recipients added yet. Click &quot;Add Whitelist&quot; or &quot;Select Group&quot; above.
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
            {cfgWhitelistList.map((wlItem, idx) => {
              if (editingWhitelistIdx === idx || !wlItem.trim()) return null;
              const info = getRecipientDisplayInfo(wlItem);
              return (
                <RecipientBadgeItem
                  key={idx}
                  idx={idx}
                  title={info.title}
                  subtitle={info.subtitle}
                  bg="#742774"
                  subtitleColor="#f3e8f3"
                  boxShadow="0 1px 3px rgba(116, 39, 116, 0.2)"
                  onSelect={() => {
                    const { countryCode: detectedCode, localNumber } = splitPhoneNumber(wlItem);
                    setChannelCountryCode(detectedCode);
                    setCfgWhitelistList((prev) => {
                      const next = [...prev];
                      next[idx] = localNumber;
                      return next;
                    });
                    setEditingWhitelistIdx(idx);
                  }}
                  onRemove={() => {
                    setCfgWhitelistList((prev) => prev.filter((_, i) => i !== idx));
                    if (editingWhitelistIdx === idx) setEditingWhitelistIdx(null);
                  }}
                />
              );
            })}
          </div>
        )}

        {editingWhitelistIdx !== null && (
          <RecipientInlineInput
            channelType={selectedChannel?.type}
            channelCountryCode={channelCountryCode}
            setChannelCountryCode={setChannelCountryCode}
            value={cfgWhitelistList[editingWhitelistIdx] ?? ""}
            accentColor="#742774"
            buttonVariant="primary"
            onChange={(newCode, newLocal) => {
              if (newCode !== channelCountryCode) {
                setChannelCountryCode(newCode);
              }
              setCfgWhitelistList((prev) => {
                const next = [...prev];
                next[editingWhitelistIdx!] = newLocal;
                return next;
              });
            }}
            onDone={() => commitEntry(editingWhitelistIdx)}
          />
        )}
      </div>
    </div>
  );
}
