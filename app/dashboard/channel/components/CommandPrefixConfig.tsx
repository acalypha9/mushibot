"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Terminal } from "lucide-react";

export interface CommandPrefixConfigProps {
  hasGroupsSelected: boolean;
  cfgCommandPrefix: string;
  setCfgCommandPrefix: (prefix: string) => void;
}

export default function CommandPrefixConfig({
  hasGroupsSelected,
  cfgCommandPrefix,
  setCfgCommandPrefix,
}: CommandPrefixConfigProps) {
  return (
    <div
      style={{
        marginTop: "12px",
        paddingTop: "14px",
        borderTop: "1px dashed var(--border)",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        opacity: hasGroupsSelected ? 1 : 0.75,
      }}
    >
      <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--foreground)", display: "flex", alignItems: "center", gap: "6px" }}>
        <Terminal style={{ width: "14px", height: "14px", color: hasGroupsSelected ? "#742774" : "var(--muted-foreground)" }} />
        <span>Custom Command Prefix</span>
        {!hasGroupsSelected && (
          <span style={{ fontSize: "10.5px", fontWeight: "500", color: "var(--muted-foreground)", padding: "1px 6px", borderRadius: "4px", background: "var(--muted)" }}>
            Disabled
          </span>
        )}
      </label>

      <div style={{ display: "flex", alignItems: "center", gap: "8px", maxWidth: "420px" }}>
        <Input
          type="text"
          disabled={!hasGroupsSelected}
          placeholder={hasGroupsSelected ? ".ai" : "No groups selected  "}
          value={cfgCommandPrefix}
          onChange={(e) => setCfgCommandPrefix(e.target.value)}
          style={{
            flex: 1,
            fontFamily: "var(--font-mono)",
            cursor: hasGroupsSelected ? "text" : "not-allowed",
          }}
        />
        {hasGroupsSelected && cfgCommandPrefix.trim() && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setCfgCommandPrefix("")}
            title="Clear prefix to reply all group messages without prefix"
          >
            Clear Prefix
          </Button>
        )}
      </div>

      <span style={{ fontSize: "11.5px", color: "var(--muted-foreground)", lineHeight: "1.45" }}>
        {!hasGroupsSelected ? (
          <span style={{ fontStyle: "italic" }}>
            Custom command prefix is only used for group messages and is disabled because no groups are currently selected. Private chats always reply directly without a prefix.
          </span>
        ) : cfgCommandPrefix.trim() ? (
          <>
            Bot only replies in group chats to messages starting with{" "}
            <strong style={{ color: "#742774", background: "#f5eef5", padding: "1px 6px", borderRadius: "4px", fontFamily: "var(--font-mono)" }}>
              {cfgCommandPrefix.trim()}
            </strong>
            . The prefix is stripped before processing. Private chats reply directly without a prefix.
          </>
        ) : (
          <>
            Prefix is empty. Bot replies to all incoming group messages directly. Private chats reply directly without a prefix.
          </>
        )}
      </span>
    </div>
  );
}
