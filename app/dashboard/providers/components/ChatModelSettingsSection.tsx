"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { InfoTooltip } from "./ModelCapabilityBadges";

interface ChatModelSettingsSectionProps {
  modelHasText: boolean;
  setModelHasText: (val: boolean) => void;
  modelHasVision: boolean;
  setModelHasVision: (val: boolean) => void;
  modelHasAudio: boolean;
  setModelHasAudio: (val: boolean) => void;
  modelHasTools: boolean;
  setModelHasTools: (val: boolean) => void;
  modelContextWindow: string;
  setModelContextWindow: (val: string) => void;
  modelReasoning: string;
  setModelReasoning: (val: string) => void;
  modelReasoningEffort: string;
  setModelReasoningEffort: (val: string) => void;
  modelTemperature: string;
  setModelTemperature: (val: string) => void;
  isReasoningSupported: boolean;
}

export function ChatModelSettingsSection({
  modelHasText,
  setModelHasText,
  modelHasVision,
  setModelHasVision,
  modelHasAudio,
  setModelHasAudio,
  modelHasTools,
  setModelHasTools,
  modelContextWindow,
  setModelContextWindow,
  modelReasoning,
  setModelReasoning,
  modelReasoningEffort,
  setModelReasoningEffort,
  modelTemperature,
  setModelTemperature,
  isReasoningSupported
}: ChatModelSettingsSectionProps) {
  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          borderBottom: "1px solid #f1f5f9",
          paddingBottom: "12px"
        }}
      >
        <span style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b" }}>
          Model capabilities
        </span>
        <span style={{ fontSize: "11px", color: "#94a3b8" }}>
          Modalities supported by the model. If the model does not support images, uncheck image.
        </span>
        <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: "#334155", marginTop: "4px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontWeight: "500" }}>
            <Input type="checkbox" checked={modelHasText} onChange={(e) => setModelHasText(e.target.checked)} style={{ accentColor: "#742774" }} />
            Text
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontWeight: "500" }}>
            <Input type="checkbox" checked={modelHasVision} onChange={(e) => setModelHasVision(e.target.checked)} style={{ accentColor: "#742774" }} />
            Image
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontWeight: "500" }}>
            <Input type="checkbox" checked={modelHasAudio} onChange={(e) => setModelHasAudio(e.target.checked)} style={{ accentColor: "#742774" }} />
            Audio
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontWeight: "500" }}>
            <Input type="checkbox" checked={modelHasTools} onChange={(e) => setModelHasTools(e.target.checked)} style={{ accentColor: "#742774" }} />
            Tool use
          </label>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "4px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b" }}>Custom request body parameters</span>
          <InfoTooltip title="Custom Parameters" description="Extra API request payload parameters." />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "12px", color: "#64748b" }}>No items</span>
          <Button type="button" variant="outline" size="sm">Modify</Button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "10px", borderTop: "1px solid #f1f5f9", paddingTop: "14px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#1e293b", whiteSpace: "nowrap" }}>Context window</span>
            <InfoTooltip title="Context Window" description="Max context token limit (0 to auto-fill)." />
          </div>
          <Input type="text" value={modelContextWindow} onChange={(e) => setModelContextWindow(e.target.value)} placeholder="0" style={{ padding: "6px 10px", fontSize: "13px", width: "100%", boxSizing: "border-box", marginTop: "2px" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#1e293b" }}>reasoning</span>
            <InfoTooltip title="Reasoning" description="Enable or disable model reasoning." />
          </div>
          <Select value={modelReasoning} onChange={(e) => setModelReasoning(e.target.value)} style={{ padding: "6px 10px", fontSize: "13px", width: "100%", boxSizing: "border-box", marginTop: "2px" }}>
            <option value="true">true</option>
            <option value="false">false</option>
          </Select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#1e293b", whiteSpace: "nowrap" }}>Thinking Level</span>
            <InfoTooltip title="Thinking / Reasoning Effort" description="Adjust reasoning/thinking effort for supported models (Auto, Minimal, Low, Medium, High, Max, Xhigh)." />
          </div>
          <Select disabled={!isReasoningSupported} value={isReasoningSupported ? modelReasoningEffort || "default" : "disabled"} onChange={(e) => setModelReasoningEffort(e.target.value)} style={{ padding: "6px 10px", fontSize: "13px", width: "100%", boxSizing: "border-box", marginTop: "2px" }}>
            {isReasoningSupported ? (
              <>
                <option value="default">Thinking: Auto</option>
                <option value="minimal">Thinking: Minimal</option>
                <option value="low">Thinking: Low</option>
                <option value="medium">Thinking: Medium</option>
                <option value="high">Thinking: High</option>
                <option value="max">Thinking: Max</option>
                <option value="xhigh">Thinking: Xhigh</option>
              </>
            ) : (
              <option value="disabled">Thinking: Disabled</option>
            )}
          </Select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#1e293b" }}>Temperature</span>
            <InfoTooltip title="Temperature" description="Sampling randomness (0.0 - 2.0)." />
          </div>
          <Input type="number" step="0.05" min="0" max="2" value={modelTemperature} onChange={(e) => setModelTemperature(e.target.value)} placeholder="0.3" style={{ padding: "6px 10px", fontSize: "13px", width: "100%", boxSizing: "border-box", marginTop: "2px" }} />
        </div>
      </div>
    </>
  );
}
