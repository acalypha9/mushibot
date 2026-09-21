"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Info } from "lucide-react";

interface ParserSettingsSectionProps {
  parserTier: string;
  setParserTier: (val: string) => void;
  parserVersion: string;
  setParserVersion: (val: string) => void;
  parserOutputTables: boolean;
  setParserOutputTables: (val: boolean) => void;
  parserCompactTables: boolean;
  setParserCompactTables: (val: boolean) => void;
  parserDisableCache: boolean;
  setParserDisableCache: (val: boolean) => void;
  parserPageRanges: string;
  setParserPageRanges: (val: string) => void;
}

const TIER_TOOLTIP_ITEMS = [
  { tier: "Fast (1)", desc: "Fastest option. Best for simple, text-only documents." },
  { tier: "Cost Effective (5)", desc: "Text-heavy documents, without diagrams and images." },
  { tier: "Agentic (10)", desc: "Documents with diagrams and images. Nothing complex." },
  { tier: "Agentic Plus (45)", desc: "Best setting for complex layouts, diagrams, and images." }
];

export function ParserSettingsSection({
  parserTier,
  setParserTier,
  parserVersion,
  setParserVersion,
  parserOutputTables,
  setParserOutputTables,
  parserCompactTables,
  setParserCompactTables,
  parserDisableCache,
  setParserDisableCache,
  parserPageRanges,
  setParserPageRanges
}: ParserSettingsSectionProps) {
  const [showTierInfo, setShowTierInfo] = useState<boolean>(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <label style={{ fontSize: "12px", fontWeight: "600", color: "#334155" }}>
            Parsing Tier (credits/pages)
          </label>
          <div style={{ position: "relative" }}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowTierInfo(!showTierInfo)}
              onMouseEnter={() => setShowTierInfo(true)}
              onMouseLeave={() => setShowTierInfo(false)}
              style={{
                borderRadius: "50%",
                width: "18px",
                height: "18px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--primary)",
                padding: 0
              }}
              title="View Tier Info"
            >
              <Info style={{ width: "12px", height: "12px" }} />
            </Button>

            {showTierInfo && (
              <div
                style={{
                  position: "absolute",
                  bottom: "calc(100% + 8px)",
                  right: 0,
                  width: "290px",
                  background: "#0E2440",
                  color: "#ffffff",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  zIndex: 100000,
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  fontSize: "11px",
                  pointerEvents: "none"
                }}
              >
                {TIER_TOOLTIP_ITEMS.map((item) => (
                  <div key={item.tier} style={{ color: "#e2e8f0", lineHeight: "1.4" }}>
                    <strong style={{ color: "#9b51e0" }}>{item.tier}</strong>: {item.desc}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <Select
          value={parserTier}
          onChange={(e) => setParserTier(e.target.value)}
          style={{ fontSize: "13px", width: "100%" }}
        >
          <option value="agentic_plus">Agentic Plus (45 Credits)</option>
          <option value="agentic">Agentic (10 Credits)</option>
          <option value="cost_effective">Cost Effective (5 Credits)</option>
          <option value="fast">Fast (1 Credits)</option>
        </Select>
        <span style={{ fontSize: "11px", color: "#94a3b8" }}>
          Select the LlamaParse engine tier used when client.parsing.parse() executes.
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <label style={{ fontSize: "12px", fontWeight: "600", color: "#334155" }}>
          Parsing Version (version)
        </label>
        <Input
          type="text"
          value={parserVersion}
          onChange={(e) => setParserVersion(e.target.value)}
          placeholder="latest"
          style={{ fontSize: "13px", width: "100%" }}
        />
        <span style={{ fontSize: "11px", color: "#94a3b8" }}>
          Version for selected tier (&apos;latest&apos;, &apos;2026-06-18&apos;).
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            fontSize: "13px",
            color: "#334155"
          }}
        >
          <Input
            type="checkbox"
            checked={parserOutputTables}
            onChange={(e) => setParserOutputTables(e.target.checked)}
            style={{ accentColor: "#742774", width: "16px", height: "16px" }}
          />
          <span>Output tables as Markdown (output_tables_as_markdown)</span>
        </label>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            fontSize: "13px",
            color: "#334155"
          }}
        >
          <Input
            type="checkbox"
            checked={parserCompactTables}
            onChange={(e) => setParserCompactTables(e.target.checked)}
            style={{ accentColor: "#742774", width: "16px", height: "16px" }}
          />
          <span>Compact Markdown tables (compact_markdown_tables)</span>
        </label>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            fontSize: "13px",
            color: "#334155"
          }}
        >
          <Input
            type="checkbox"
            checked={parserDisableCache}
            onChange={(e) => setParserDisableCache(e.target.checked)}
            style={{ accentColor: "#742774", width: "16px", height: "16px" }}
          />
          <span>Disable cache (disable_cache)</span>
        </label>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "4px" }}>
        <label style={{ fontSize: "12px", fontWeight: "600", color: "#334155" }}>
          Page Ranges (page_ranges)
        </label>
        <Input
          type="text"
          value={parserPageRanges}
          onChange={(e) => setParserPageRanges(e.target.value)}
          placeholder="1-10 or leave empty for all pages"
          style={{ fontSize: "13px", width: "100%" }}
        />
        <span style={{ fontSize: "11px", color: "#94a3b8" }}>
          Filter specific pages to parse (leave empty to parse entire document).
        </span>
      </div>
    </div>
  );
}
