"use client";

import React from "react";
import { Input } from "@/components/ui/Input";
import { RATE_LIMIT_BOUNDS } from "./messageLimitsLogic";

export interface RateLimitsFormProps {
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
}

export default function RateLimitsForm({
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
}: RateLimitsFormProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
      <div>
        <label style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
          Message Rate Limit (msgs / min)
        </label>
        <Input
          type="number"
          min={RATE_LIMIT_BOUNDS.rateLimit.min}
          max={RATE_LIMIT_BOUNDS.rateLimit.max}
          value={cfgRateLimit}
          onChange={(e) => setCfgRateLimit(Number(e.target.value))}
        />
        <span style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>Max messages processed per user per minute</span>
      </div>

      <div>
        <label style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
          Max Token Limit per Session
        </label>
        <Input
          type="number"
          min={RATE_LIMIT_BOUNDS.maxTokens.min}
          max={RATE_LIMIT_BOUNDS.maxTokens.max}
          value={cfgMaxTokens}
          onChange={(e) => setCfgMaxTokens(Number(e.target.value))}
        />
        <span style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>Maximum total tokens allowed per chat session</span>
      </div>

      <div>
        <label style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
          Response Timeout (seconds)
        </label>
        <Input
          type="number"
          min={RATE_LIMIT_BOUNDS.timeout.min}
          max={RATE_LIMIT_BOUNDS.timeout.max}
          value={cfgTimeout}
          onChange={(e) => setCfgTimeout(Number(e.target.value))}
        />
        <span style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>Timeout duration for AI response generation (default 120 seconds)</span>
      </div>

      <div>
        <label style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
          Session Timeout (seconds)
        </label>
        <Input
          type="number"
          min={RATE_LIMIT_BOUNDS.sessionTimeout.min}
          max={RATE_LIMIT_BOUNDS.sessionTimeout.max}
          value={cfgSessionTimeout}
          onChange={(e) => setCfgSessionTimeout(Number(e.target.value))}
        />
        <span style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>Inactivity duration before ending current session. Next chat creates a new session (default 300 seconds)</span>
      </div>

      <div>
        <label style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
          Typing Simulation Delay (ms)
        </label>
        <Input
          type="number"
          min={RATE_LIMIT_BOUNDS.typingDelay.min}
          max={RATE_LIMIT_BOUNDS.typingDelay.max}
          step={RATE_LIMIT_BOUNDS.typingDelay.step}
          value={cfgTypingDelay}
          onChange={(e) => setCfgTypingDelay(Number(e.target.value))}
        />
        <span style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>Delay before sending reply to simulate human typing</span>
      </div>
    </div>
  );
}
