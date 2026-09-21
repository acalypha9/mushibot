"use client";

import React, { CSSProperties } from "react";
import { Input } from "@/components/ui/Input";
import { Info } from "lucide-react";
import { computeEffectiveToggleStates } from "./uploadModalLogic";

export interface UploadOptionsSectionProps {
  selectedFile: File | null;
  uploadChunkSize: number;
  uploadChunkOverlap: number;
  convertToMd: boolean;
  saveParserOutput: boolean;
  showUploadTooltip: boolean;
  onSetUploadChunkSize: (size: number) => void;
  onSetUploadChunkOverlap: (overlap: number) => void;
  onSetConvertToMd: (convert: boolean) => void;
  onSetSaveParserOutput: (save: boolean) => void;
  onSetShowUploadTooltip: (show: boolean | ((prev: boolean) => boolean)) => void;
}

function ToggleSwitch({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const switchContainerStyle: CSSProperties = {
    position: "relative",
    display: "inline-block",
    width: "42px",
    height: "22px",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.45 : 1,
    flexShrink: 0,
  };

  const trackStyle: CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: checked ? "var(--primary)" : "#e2e8f0",
    transition: ".2s",
    borderRadius: "22px",
  };

  const thumbStyle: CSSProperties = {
    position: "absolute",
    content: '""',
    height: "16px",
    width: "16px",
    left: checked ? "23px" : "3px",
    bottom: "3px",
    backgroundColor: "#ffffff",
    transition: ".2s",
    borderRadius: "50%",
    boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
  };

  return (
    <label style={switchContainerStyle}>
      <Input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        style={{ opacity: 0, width: 0, height: 0, position: "absolute" }}
      />
      <span style={trackStyle}>
        <span style={thumbStyle} />
      </span>
    </label>
  );
}

export default function UploadOptionsSection({
  selectedFile,
  uploadChunkSize,
  uploadChunkOverlap,
  convertToMd,
  saveParserOutput,
  showUploadTooltip,
  onSetUploadChunkSize,
  onSetUploadChunkOverlap,
  onSetConvertToMd,
  onSetSaveParserOutput,
  onSetShowUploadTooltip,
}: UploadOptionsSectionProps) {
  const { isSelectedFileMd, isMdChecked, isParserChecked } =
    computeEffectiveToggleStates({
      selectedFile,
      convertToMd,
      saveParserOutput,
    });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <h4
        style={{
          fontSize: "11px",
          fontWeight: "bold",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "var(--foreground)",
          margin: 0,
        }}
      >
        Chunk Settings
      </h4>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div>
          <label style={{ fontSize: "11px", color: "var(--muted-foreground)", fontWeight: "600" }}>
            Chunk Size
          </label>
          <Input
            type="number"
            value={uploadChunkSize}
            onChange={(e) => onSetUploadChunkSize(Number(e.target.value))}
            style={{ marginTop: "2px" }}
          />
          <div style={{ fontSize: "10px", color: "var(--muted-foreground)", marginTop: "2px" }}>
            Number of characters per chunk (default: 512)
          </div>
        </div>
        <div>
          <label style={{ fontSize: "11px", color: "var(--muted-foreground)", fontWeight: "600" }}>
            Chunk Overlap
          </label>
          <Input
            type="number"
            value={uploadChunkOverlap}
            onChange={(e) => onSetUploadChunkOverlap(Number(e.target.value))}
            style={{ marginTop: "2px" }}
          />
          <div style={{ fontSize: "10px", color: "var(--muted-foreground)", marginTop: "2px" }}>
            Overlapping characters between chunks (default: 50)
          </div>
        </div>
      </div>

      {/* Convert to MD File Toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
        <ToggleSwitch
          checked={isMdChecked}
          disabled={isSelectedFileMd}
          onChange={(e) => onSetConvertToMd(e.target.checked)}
        />
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12.5px",
            fontWeight: "600",
            color: isSelectedFileMd ? "var(--muted-foreground)" : "var(--foreground)",
            opacity: isSelectedFileMd ? 0.45 : 1,
          }}
        >
          Convert to md file (Recommended)
          <span
            style={{ position: "relative", display: "inline-flex", alignItems: "center", cursor: "pointer" }}
            onClick={(e) => {
              e.preventDefault();
              onSetShowUploadTooltip((prev) => !prev);
            }}
            onMouseEnter={() => onSetShowUploadTooltip(true)}
            onMouseLeave={() => onSetShowUploadTooltip(false)}
          >
            <Info style={{ width: "15px", height: "15px", color: isSelectedFileMd ? "var(--muted-foreground)" : "var(--primary)" }} />
            {showUploadTooltip && (
              <div
                style={{
                  position: "absolute",
                  bottom: "calc(100% + 8px)",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "var(--card)",
                  color: "var(--foreground)",
                  border: "1px solid var(--border)",
                  fontSize: "12px",
                  fontWeight: "500",
                  padding: "7px 12px",
                  borderRadius: "var(--radius-md, 8px)",
                  whiteSpace: "nowrap",
                  boxShadow: "var(--shadow-md)",
                  zIndex: 100,
                  pointerEvents: "none",
                }}
              >
                LLMs process and understand structured documents better in Markdown format.
              </div>
            )}
          </span>
        </span>
      </div>

      {/* Save Output of Parser Toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
        <ToggleSwitch
          checked={isParserChecked}
          disabled={isSelectedFileMd}
          onChange={(e) => onSetSaveParserOutput(e.target.checked)}
        />
        <span
          style={{
            fontSize: "12.5px",
            fontWeight: "600",
            color: isSelectedFileMd ? "var(--muted-foreground)" : "var(--foreground)",
            opacity: isSelectedFileMd ? 0.45 : 1,
          }}
        >
          Save output of parser
        </span>
      </div>
    </div>
  );
}
