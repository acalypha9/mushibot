"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CountryCodePicker, extractCountryCodeFromInput } from "@/lib/countryCodes";

export interface RecipientInlineInputProps {
  channelType?: "WHATSAPP" | "TELEGRAM";
  channelCountryCode: string;
  setChannelCountryCode: (code: string) => void;
  value: string;
  accentColor: string;
  buttonVariant?: "primary" | "danger";
  onChange: (newCountryCode: string, newLocalVal: string) => void;
  onDone: () => void;
}

export default function RecipientInlineInput({
  channelType,
  channelCountryCode,
  setChannelCountryCode,
  value,
  accentColor,
  buttonVariant = "primary",
  onChange,
  onDone,
}: RecipientInlineInputProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        marginTop: "4px",
        borderRadius: "8px",
        border: `1.5px solid ${accentColor}`,
        background: "var(--background)",
        boxShadow: `0 0 0 3px ${accentColor}1f`,
        boxSizing: "border-box",
        overflow: "visible",
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          onDone();
        }
      }}
    >
      {channelType === "WHATSAPP" && (
        <>
          <CountryCodePicker
            value={channelCountryCode}
            onChange={(val) => setChannelCountryCode(val)}
            accentColor={accentColor}
          />
          <div style={{ width: "1px", height: "22px", background: "var(--border)", flexShrink: 0 }} />
        </>
      )}
      <Input
        autoFocus
        type="text"
        value={value}
        onChange={(e) => {
          const rawInput = e.target.value;
          const { countryCode: newCode, localNumber: cleanedLocal, hasChanged } = extractCountryCodeFromInput(rawInput, channelCountryCode);
          onChange(hasChanged ? newCode : channelCountryCode, hasChanged ? cleanedLocal : rawInput);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onDone();
          }
        }}
        placeholder={
          channelType === "WHATSAPP"
            ? "8123... or ...@g.us"
            : "@username or Chat ID"
        }
        style={{
          flex: 1,
          border: "none",
          outline: "none",
          background: "transparent",
          padding: "8px 12px",
          fontSize: "13px",
          boxSizing: "border-box",
        }}
      />
      <div style={{ paddingRight: "5px", flexShrink: 0 }}>
        <Button
          type="button"
          variant={buttonVariant}
          size="sm"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onDone}
        >
          Done
        </Button>
      </div>
    </div>
  );
}
