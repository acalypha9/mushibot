"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../auth";
import Link from "next/link";
import Button from "@/components/ui/Button";
import {
  FileText,
  Database,
  CheckSquare,
  Sparkles,
  Grid,
  FileCode,
  Box,
  Pencil,
  ArrowRight,
  Loader2,
  RefreshCw,
  Cpu,
  Zap,
  Users,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Activity,
  BarChart3,
  PieChart,
  Table as TableIcon,
  Clock,
  ChevronRight,
  Shield,
  MessageSquare,
  BookOpen,
  GitBranch,
  Wrench,
  Key
} from "lucide-react";

// Formatting utility for numbers
function formatNumber(num: number): string {
  if (num === undefined || num === null) return "0";
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + "B";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toLocaleString();
}

interface RecentConversation {
  id: string;
  title: string;
  channel: string;
  status: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  updated_at?: string;
}

interface ModelBreakdownItem {
  model_name: string;
  requests: number;
  input_tokens: number;
  output_tokens: number;
  cached_tokens: number;
  total_tokens: number;
  percentage: number;
}

interface AccountBreakdownItem {
  name: string;
  email: string;
  total_tokens: number;
  percentage: number;
}

interface DailyHistoryItem {
  date: string;
  prompt_tokens: number;
  completion_tokens: number;
  reasoning_tokens: number;
  total_tokens: number;
  requests: number;
}

interface DashboardOverviewData {
  time_range: string;
  conversations: {
    total: number;
    open: number;
    resolved: number;
    web_count?: number;
    whatsapp_count?: number;
    total_messages?: number;
    ai_messages?: number;
    customer_messages?: number;
    recent: RecentConversation[];
  };
  token_analytics?: {
    total_prompt_tokens: number;
    total_completion_tokens: number;
    total_reasoning_tokens: number;
    cached_tokens: number;
    total_tokens: number;
    active_accounts_count: number;
    models_used_count: number;
    model_breakdown: ModelBreakdownItem[];
    account_breakdown: AccountBreakdownItem[];
    daily_history: DailyHistoryItem[];
    model_series: Record<string, Array<{ date: string; total_tokens: number }>>;
  };
  knowledge?: {
    total_documents: number;
    active_documents: number;
    total_collections?: number;
    total_chunks?: number;
  };
  channel?: {
    whatsapp_status: string;
    whatsapp_phone?: string;
    active_channels: number;
  };
  tools?: {
    total_tools: number;
    enabled_tools: number;
    mcp_servers?: number;
    active_mcp_servers?: number;
  };
  providers?: {
    total_providers: number;
    active_providers: number;
    default_model: string;
  };
  users?: {
    total_users: number;
    admins: number;
    agents: number;
    customers: number;
  };
}

const GRAPH_COLORS = ["#742774", "#9b51e0", "#c7b2c7", "#E06D53", "#502450"];

function formatMMDD(dateStr: string, timeRange?: string): string {
  if (!dateStr) return "";
  if (timeRange === "week") {
    return dateStr; // Format yyyy-mm-dd for weeks
  }
  if (timeRange === "hour" || dateStr.includes(":")) {
    return dateStr; // Format 15:00 for hours
  }
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[1]}/${parts[2]}`;
  }
  return dateStr;
}

function createSmoothPath(pts: { x: number; y: number }[]) {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x},${pts[0].y}`;

  let path = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const curr = pts[i];
    const next = pts[i + 1];
    const cp1x = curr.x + (next.x - curr.x) / 2;
    const cp1y = curr.y;
    const cp2x = curr.x + (next.x - curr.x) / 2;
    const cp2y = next.y;
    path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${next.x},${next.y}`;
  }
  return path;
}

// 1. DYNAMIC MODEL USAGE TREND GRAPH (UNSTACKED, PRECISE, NO GLOW, ACTIVE DATES ONLY, HOVER SMALL DOTS)
function ModelUsageTrendGraph({
  data,
  modelSeries,
  modelBreakdown,
  accountBreakdown,
  trendView,
  timeRange
}: {
  data: DailyHistoryItem[];
  modelSeries?: Record<string, Array<{ date: string; total_tokens: number }>>;
  modelBreakdown: ModelBreakdownItem[];
  accountBreakdown: AccountBreakdownItem[];
  trendView: "model" | "account";
  timeRange?: string;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div style={{ height: "220px", display: "flex", alignItems: "center", justifyContent: "center", color: "#8a8886", fontSize: "13px", fontStyle: "italic" }}>
        No telemetry history available for this timeframe.
      </div>
    );
  }

  const seriesList = trendView === "model"
    ? (modelBreakdown.length > 0 ? modelBreakdown.map(m => m.model_name) : ["Default Model"])
    : (accountBreakdown.length > 0 ? accountBreakdown.map(a => a.name) : ["Default Account"]);

  const rawSeriesValuesPerDate: number[][] = data.map((d) => {
    return seriesList.map((sName) => {
      if (trendView === "model") {
        if (modelSeries && modelSeries[sName]) {
          const match = modelSeries[sName].find((ms) => ms.date === d.date);
          if (match) return match.total_tokens;
        }
        return 0;
      } else {
        const ab = accountBreakdown.find((a) => a.name === sName);
        if (ab && ab.total_tokens && data.length > 0 && d.total_tokens > 0) {
          return Math.round(ab.total_tokens / data.length);
        }
        return 0;
      }
    });
  });

  // Filter out dates that have NO usage across all series
  const activeIndices = data
    .map((_, i) => i)
    .filter((i) => rawSeriesValuesPerDate[i].some((val) => val > 0));

  const chartData = activeIndices.length > 0 ? activeIndices.map((i) => data[i]) : data;
  const seriesValuesPerDate = activeIndices.length > 0 ? activeIndices.map((i) => rawSeriesValuesPerDate[i]) : rawSeriesValuesPerDate;

  const svgWidth = 600;
  const svgHeight = 180;
  const padLeft = 0;
  const padRight = 0;
  const padTop = 10;
  const padBottom = 10;

  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  let maxSeriesVal = 10;
  seriesValuesPerDate.forEach((values) => {
    values.forEach((val) => {
      if (val > maxSeriesVal) maxSeriesVal = val;
    });
  });
  if (maxSeriesVal <= 100) maxSeriesVal = 100;
  const yMax = Math.ceil(maxSeriesVal * 1.15);

  const getX = (i: number) => {
    if (chartData.length <= 1) return padLeft + chartW / 2;
    return padLeft + (i / (chartData.length - 1)) * chartW;
  };

  const getY = (val: number) => {
    return padTop + chartH - (val / yMax) * chartH;
  };

  const layers = seriesList.map((sName, sIdx) => {
    const color = GRAPH_COLORS[sIdx % GRAPH_COLORS.length];

    const pts = chartData.map((d, i) => {
      const val = seriesValuesPerDate[i][sIdx];
      return {
        x: getX(i),
        y: getY(val),
        val,
        date: d.date
      };
    });

    const pathStr = createSmoothPath(pts);

    const baselineY = padTop + chartH;
    const botPts = pts.map((p) => ({ x: p.x, y: baselineY }));
    const revBotPts = [...botPts].reverse();
    const botPathStr = createSmoothPath(revBotPts).replace(/^M/, "L");
    const areaPathStr = `${pathStr} ${botPathStr} Z`;

    return {
      sName,
      color,
      pts,
      pathStr,
      areaPathStr
    };
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", position: "relative" }}>
      <div style={{ display: "flex", gap: "10px", width: "100%", alignItems: "stretch" }}>
        {/* HTML Y-AXIS LABELS (Pristine, Non-Distorted Text) */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          height: `${svgHeight}px`,
          paddingTop: `${padTop - 5}px`,
          paddingBottom: `${padBottom - 5}px`,
          boxSizing: "border-box",
          fontSize: "11px",
          fontWeight: "600",
          color: "#64748b",
          textAlign: "right",
          minWidth: "48px",
          userSelect: "none"
        }}>
          <span>{formatNumber(yMax)}</span>
          <span>{formatNumber(yMax * 0.75)}</span>
          <span>{formatNumber(yMax * 0.5)}</span>
          <span>{formatNumber(yMax * 0.25)}</span>
          <span>0</span>
        </div>

        {/* SVG GRAPH CANVAS AREA */}
        <div style={{ flex: 1, position: "relative", height: `${svgHeight}px` }} onMouseLeave={() => setHoveredIndex(null)}>
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none" style={{ width: "100%", height: "100%", overflow: "visible" }}>
            <defs>
              {layers.map((layer, idx) => (
                <linearGradient key={idx} id={`gradient-layer-${idx}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={layer.color} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={layer.color} stopOpacity="0.02" />
                </linearGradient>
              ))}
            </defs>

            {/* Y-Axis Horizontal Dotted Gridlines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
              const y = padTop + chartH * (1 - ratio);
              return (
                <line key={idx} x1={padLeft} y1={y} x2={padLeft + chartW} y2={y} stroke="#f3f2f1" strokeDasharray="4 4" />
              );
            })}

            {/* Render Area Fills */}
            {layers.map((layer, idx) => (
              <path key={`area-${idx}`} d={layer.areaPathStr} fill={`url(#gradient-layer-${idx})`} stroke="none" />
            ))}

            {/* Render Line Strokes */}
            {layers.map((layer, idx) => (
              <path key={`stroke-${idx}`} d={layer.pathStr} fill="none" stroke={layer.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            ))}

            {/* Interactive Hover Guide Line & Data Points */}
            {chartData.map((d, i) => {
              const x = getX(i);

              return (
                <g key={i} onMouseEnter={() => setHoveredIndex(i)} style={{ cursor: "pointer" }}>
                  <rect
                    x={x - (chartW / (Math.max(chartData.length, 1) * 2))}
                    y={padTop}
                    width={chartW / Math.max(chartData.length, 1)}
                    height={chartH}
                    fill="transparent"
                  />

                  {hoveredIndex === i && (
                    <line x1={x} y1={padTop} x2={x} y2={padTop + chartH} stroke="#323130" strokeDasharray="3 3" strokeOpacity="0.3" />
                  )}

                  {hoveredIndex === i && layers.map((layer, lIdx) => {
                    const pt = layer.pts[i];
                    return (
                      <circle
                        key={lIdx}
                        cx={pt.x}
                        cy={pt.y}
                        r="3.5"
                        fill={layer.color}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                    );
                  })}
                </g>
              );
            })}
          </svg>

          {/* Hover Tooltip Popover */}
          {hoveredIndex !== null && chartData[hoveredIndex] && (
            <div style={{
              position: "absolute",
              top: "10px",
              left: hoveredIndex > chartData.length / 2 ? "15px" : "auto",
              right: hoveredIndex > chartData.length / 2 ? "auto" : "15px",
              backgroundColor: "#323130",
              color: "#ffffff",
              padding: "10px 14px",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              pointerEvents: "none",
              zIndex: 40,
              minWidth: "180px",
              fontSize: "12px"
            }}>
              <div style={{ fontWeight: "700", marginBottom: "6px", borderBottom: "1px solid rgba(255,255,255,0.15)", paddingBottom: "4px" }}>
                {chartData[hoveredIndex].date}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {layers
                  .map((layer, lIdx) => ({
                    layer,
                    val: seriesValuesPerDate[hoveredIndex][lIdx]
                  }))
                  .sort((a, b) => b.val - a.val)
                  .map(({ layer, val }, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "rgba(255,255,255,0.8)" }}>
                        <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: layer.color, display: "inline-block" }} />
                        {layer.sName}
                      </span>
                      <strong style={{ color: "#ffffff", fontFamily: "var(--font-mono)" }}>
                        {formatNumber(val)}
                      </strong>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* HTML X-AXIS DATES (Pristine, Non-Distorted Text) */}
      <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: "58px", paddingRight: "0px", fontSize: "11px", fontWeight: "600", color: "#64748b" }}>
        {chartData.map((d, i) => (
          <span key={i}>{formatMMDD(d.date, timeRange)}</span>
        ))}
      </div>

      {/* Legend at Bottom */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", flexWrap: "wrap", marginTop: "4px" }}>
        {layers.map((layer, idx) => (
          <div key={idx} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#605e5c" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "3px", backgroundColor: layer.color }} />
            <span style={{ fontWeight: "600", color: "#323130" }}>{layer.sName}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 2. DYNAMIC TOKEN DISTRIBUTION BAR CHART (GROUPED 3 BARS: INPUT, CACHED, OUTPUT PER ACTIVE DATE)
function TokenUsageTrendBarChart({ data, timeRange }: { data: DailyHistoryItem[]; timeRange?: string }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const activeData = (data || []).filter(
    (d) => (d.total_tokens || 0) > 0 || (d.prompt_tokens || 0) > 0 || (d.completion_tokens || 0) > 0 || (d.reasoning_tokens || 0) > 0
  );

  if (!activeData || activeData.length === 0) {
    return (
      <div style={{ height: "180px", display: "flex", alignItems: "center", justifyContent: "center", color: "#8a8886", fontSize: "12px", fontStyle: "italic" }}>
        No telemetry data available for this timeframe.
      </div>
    );
  }

  const svgWidth = 240;
  const svgHeight = 150;
  const padLeft = 0;
  const padRight = 0;
  const padTop = 10;
  const padBottom = 10;

  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  let maxVal = 10;
  activeData.forEach((d) => {
    const m = Math.max(d.prompt_tokens || 0, d.reasoning_tokens || 0, d.completion_tokens || 0);
    if (m > maxVal) maxVal = m;
  });
  const yMax = Math.ceil(maxVal * 1.15);

  const colors = {
    input: "#742774",
    cached: "#c7b2c7",
    output: "#9b51e0"
  };

  const slotW = chartW / activeData.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", position: "relative" }}>
      <div style={{ display: "flex", width: "100%" }}>
        {/* HTML Y-AXIS NUMERIC SCALE (Pristine, Non-Distorted Text) */}
        <div
          style={{
            width: "50px",
            height: `${svgHeight}px`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "flex-end",
            paddingRight: "8px",
            fontSize: "11px",
            fontWeight: "600",
            color: "#64748b",
            fontFamily: "var(--font-mono)",
            boxSizing: "border-box"
          }}
        >
          {[1, 0.75, 0.5, 0.25, 0].map((ratio, idx) => (
            <span key={idx}>{formatNumber(yMax * ratio)}</span>
          ))}
        </div>

        {/* SVG BAR GRAPH CANVAS AREA */}
        <div style={{ flex: 1, position: "relative", height: `${svgHeight}px` }}>
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none" style={{ width: "100%", height: "100%", overflow: "visible" }}>
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
              const y = padTop + chartH * (1 - ratio);
              return (
                <line key={idx} x1={padLeft} y1={y} x2={padLeft + chartW} y2={y} stroke="#f3f2f1" strokeDasharray="4 4" />
              );
            })}

            {activeData.map((d, idx) => {
              const groupW = Math.min(slotW * 0.75, 42);
              const barGap = 2;
              const barW = Math.max((groupW - barGap * 2) / 3, 5);
              const groupX = padLeft + idx * slotW + (slotW - groupW) / 2;

              const inputH = ((d.prompt_tokens || 0) / yMax) * chartH;
              const cachedH = ((d.reasoning_tokens || 0) / yMax) * chartH;
              const outputH = ((d.completion_tokens || 0) / yMax) * chartH;

              const inputY = padTop + chartH - inputH;
              const cachedY = padTop + chartH - cachedH;
              const outputY = padTop + chartH - outputH;

              const xInput = groupX;
              const xCached = groupX + barW + barGap;
              const xOutput = groupX + (barW + barGap) * 2;

              const isHovered = hoveredIdx === idx;

              return (
                <g key={idx} style={{ cursor: "pointer" }} onMouseEnter={() => setHoveredIdx(idx)} onMouseLeave={() => setHoveredIdx(null)}>
                  <rect x={padLeft + idx * slotW} y={padTop} width={slotW} height={chartH} fill="transparent" />

                  {isHovered && (
                    <line x1={groupX + groupW / 2} y1={padTop} x2={groupX + groupW / 2} y2={padTop + chartH} stroke="#323130" strokeDasharray="3 3" strokeOpacity="0.3" />
                  )}

                  <rect x={xInput} y={inputY} width={barW} height={Math.max(inputH, 3)} rx="2" fill={colors.input} opacity={isHovered ? 1 : 0.85} />
                  <rect x={xCached} y={cachedY} width={barW} height={Math.max(cachedH, 3)} rx="2" fill={colors.cached} opacity={isHovered ? 1 : 0.85} />
                  <rect x={xOutput} y={outputY} width={barW} height={Math.max(outputH, 3)} rx="2" fill={colors.output} opacity={isHovered ? 1 : 0.85} />
                </g>
              );
            })}
          </svg>

          {hoveredIdx !== null && activeData[hoveredIdx] && (
            <div style={{
              position: "absolute",
              top: "5px",
              right: hoveredIdx > activeData.length / 2 ? "auto" : "10px",
              left: hoveredIdx > activeData.length / 2 ? "10px" : "auto",
              backgroundColor: "#323130",
              color: "#ffffff",
              padding: "10px 14px",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              pointerEvents: "none",
              zIndex: 30,
              minWidth: "160px",
              fontSize: "12px"
            }}>
              <div style={{ fontWeight: "700", marginBottom: "6px", paddingBottom: "2px" }}>
                {activeData[hoveredIdx].date}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "rgba(255,255,255,0.8)" }}>
                    <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#605e5c", display: "inline-block" }} /> Total:
                  </span>
                  <strong style={{ color: "#ffffff", fontFamily: "var(--font-mono)" }}>
                    {formatNumber((activeData[hoveredIdx].prompt_tokens || 0) + (activeData[hoveredIdx].reasoning_tokens || 0) + (activeData[hoveredIdx].completion_tokens || 0))}
                  </strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "rgba(255,255,255,0.8)" }}>
                    <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: colors.input, display: "inline-block" }} /> Input:
                  </span>
                  <strong style={{ color: "#ffffff", fontFamily: "var(--font-mono)" }}>{formatNumber(activeData[hoveredIdx].prompt_tokens || 0)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "rgba(255,255,255,0.8)" }}>
                    <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: colors.cached, display: "inline-block" }} /> Cached token:
                  </span>
                  <strong style={{ color: "#ffffff", fontFamily: "var(--font-mono)" }}>{formatNumber(activeData[hoveredIdx].reasoning_tokens || 0)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "rgba(255,255,255,0.8)" }}>
                    <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: colors.output, display: "inline-block" }} /> Output:
                  </span>
                  <strong style={{ color: "#ffffff", fontFamily: "var(--font-mono)" }}>{formatNumber(activeData[hoveredIdx].completion_tokens || 0)}</strong>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px", paddingTop: "6px", borderTop: "1px solid rgba(255,255,255,0.15)" }}>
                <span style={{ color: "rgba(255,255,255,0.7)" }}>Requests:</span>
                <strong style={{ color: "#ffffff", fontFamily: "var(--font-mono)" }}>{activeData[hoveredIdx].requests || 0}</strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* HTML X-AXIS DATES (Pristine, Non-Distorted Text) */}
      <div style={{ display: "flex", justifyContent: "space-around", paddingLeft: "58px", fontSize: "11px", fontWeight: "600", color: "#64748b" }}>
        {activeData.map((d, i) => (
          <span key={i}>{formatMMDD(d.date, timeRange)}</span>
        ))}
      </div>

      {/* Legend at Bottom */}
      <div style={{ display: "flex", justifyContent: "center", gap: "12px", fontSize: "11px", color: "#605e5c", fontWeight: "600", marginTop: "4px" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: colors.input }} /> Input
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: colors.cached }} /> Cached
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: colors.output }} /> Output
        </span>
      </div>
    </div>
  );
}

// 3. DYNAMIC BY ACCOUNT DONUT CHART
function AccountDonutChart({ accounts }: { accounts: AccountBreakdownItem[] }) {
  const size = 160;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circum = 2 * Math.PI * radius;

  if (!accounts || accounts.length === 0) {
    return (
      <div style={{ height: "160px", display: "flex", alignItems: "center", justifyContent: "center", color: "#8a8886", fontSize: "12px", fontStyle: "italic" }}>
        No account data available
      </div>
    );
  }

  const accountSegments = accounts.map((account, index) => ({
    account,
    color: GRAPH_COLORS[index % GRAPH_COLORS.length],
    offsetPercentage: accounts
      .slice(0, index)
      .reduce((total, previousAccount) => total + previousAccount.percentage, 0),
  }));

  return (
    <div style={{ display: "flex", justifyContent: "center", position: "relative", marginBottom: "16px" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f3f2f1" strokeWidth={strokeWidth} />
        {accountSegments.map(({ account, color, offsetPercentage }, index) => {
          const strokeDasharray = `${(account.percentage / 100) * circum} ${circum}`;
          const strokeDashoffset = -((offsetPercentage / 100) * circum);

          return (
            <circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
        })}
      </svg>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
        <div style={{ fontSize: "16px", fontWeight: "700", fontFamily: "var(--font-mono)", color: "#323130" }}>100%</div>
        <div style={{ fontSize: "10px", color: "#605e5c", textTransform: "uppercase" }}>Allocated</div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { token, user } = useAuth();

  // Navigation & View Toggles
  const [activeTab, setActiveTab] = useState<"telemetry" | "modules" | "apps">("telemetry");
  const [appsTab, setAppsTab] = useState<"apps" | "plans" | "solutions">("apps");
  const [timeRange, setTimeRange] = useState<"hour" | "day" | "week">("day");
  const [trendView, setTrendView] = useState<"model" | "account">("model");
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Data & Loading States
  const [data, setData] = useState<DashboardOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async (range = timeRange, isManualRefresh = false) => {
    if (!token) return;
    if (isManualRefresh) setRefreshing(true);
    else if (!data) setLoading(true);

    try {
      const res = await fetch(`/api/dashboard/overview?time_range=${range}&_t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store"
      });
      if (res.ok) {
        const resData: DashboardOverviewData = await res.json().catch(() => null);
        if (resData) setData(resData);
      }
    } catch (err) {
      console.error("Failed to load dashboard metrics", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard(timeRange);
  }, [token, timeRange]);

  const handleRefresh = () => {
    fetchDashboard(timeRange, true);
  };

  const firstName = user?.full_name ? user.full_name.split(" ")[0] : "Administrator";

  // Real telemetry data from API (no hardcoded mock fallbacks)
  const telemetry = useMemo(() => {
    return data?.token_analytics || {
      total_tokens: 0,
      total_prompt_tokens: 0,
      total_completion_tokens: 0,
      total_reasoning_tokens: 0,
      cached_tokens: 0,
      active_accounts_count: 0,
      models_used_count: 0,
      model_breakdown: [],
      account_breakdown: [],
      daily_history: [],
      model_series: {}
    };
  }, [data?.token_analytics]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "70vh",
          gap: "14px",
          color: "#605e5c",
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        }}
      >
        <Loader2 style={{ width: "32px", height: "32px", animation: "spin 1s linear infinite", color: "#742774" }} />
        <span style={{ fontSize: "14px", fontWeight: "600", color: "#323130" }}>Loading Telemetry Dashboard...</span>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100%",
        backgroundColor: "#faf9f8",
        padding: "28px 40px 60px 40px",
        boxSizing: "border-box",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: "#323130"
      }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        {/* 1. TOP HEADER */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#323130", margin: 0, letterSpacing: "-0.01em" }}>
              Welcome back, {firstName}
            </h1>
            <p style={{ fontSize: "13px", color: "#605e5c", marginTop: "4px", margin: 0 }}>
              Overview of AI telemetry, token consumption, and system modules.
            </p>
          </div>
        </header>

        {/* 2. NAVIGATION TABS */}
        <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #e1dfdd", marginBottom: "20px", paddingBottom: "2px" }}>
          <Button
            variant={activeTab === "telemetry" ? "primary" : "ghost"}
            size="md"
            onClick={() => setActiveTab("telemetry")}
          >
            <Activity style={{ width: "16px", height: "16px" }} />
            <span>Telemetry & Token Stats</span>
          </Button>

          <Button
            variant={activeTab === "modules" ? "primary" : "ghost"}
            size="md"
            onClick={() => setActiveTab("modules")}
          >
            <Grid style={{ width: "16px", height: "16px" }} />
            <span>System Modules</span>
          </Button>
        </div>

        {/* ---------------------------------------------------- */}
        {/* TAB 1: TELEMETRY & TOKEN STATS (PRIMARY REQUIREMENT) */}
        {/* ---------------------------------------------------- */}
        {activeTab === "telemetry" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* STAT FILTERS ROW (BELOW TAB LINE, ALIGNED TOP RIGHT ABOVE "MODELS USED") */}
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "10px" }}>
              {/* Timeframe Filter (24 Hours, 30 Days, 12 Weeks) */}
              <div
                style={{
                  display: "flex",
                  backgroundColor: "#ffffff",
                  border: "1px solid #e1dfdd",
                  borderRadius: "8px",
                  padding: "3px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                }}
              >
                {(["hour", "day", "week"] as const).map((r) => (
                  <Button
                    key={r}
                    variant={timeRange === r ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setTimeRange(r)}
                  >
                    {r === "hour" ? "Hours" : r === "day" ? "Days" : "Weeks"}
                  </Button>
                ))}
              </div>

              {/* Refresh Control beside Timeframe Filter */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                title="Refresh Dashboard Metrics"
              >
                <RefreshCw
                  style={{
                    width: "13px",
                    height: "13px",
                    color: "#742774",
                    animation: refreshing ? "spin 1s linear infinite" : "none"
                  }}
                />
                <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
              </Button>
            </div>

            {/* 6 KEY METRIC CARDS GRID */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "16px" }}>
              {/* Card 1: Total Tokens */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e1dfdd",
                  borderRadius: "12px",
                  padding: "18px 16px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "600", color: "#605e5c" }}>Total Tokens</span>
                  <div style={{ padding: "6px", backgroundColor: "#efe5ef", borderRadius: "8px" }}>
                    <Zap style={{ width: "16px", height: "16px", color: "#742774" }} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "22px", fontWeight: "700", fontFamily: "'Fira Code', Consolas, monospace", color: "#323130" }}>
                    {formatNumber(telemetry.total_tokens)}
                  </div>
                </div>
              </div>

              {/* Card 2: Input Tokens */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e1dfdd",
                  borderRadius: "12px",
                  padding: "18px 16px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "600", color: "#605e5c" }}>Input Tokens</span>
                  <div style={{ padding: "6px", backgroundColor: "#efe5ef", borderRadius: "8px" }}>
                    <BarChart3 style={{ width: "16px", height: "16px", color: "#742774" }} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "22px", fontWeight: "700", fontFamily: "'Fira Code', Consolas, monospace", color: "#323130" }}>
                    {formatNumber(telemetry.total_prompt_tokens)}
                  </div>
                </div>
              </div>

              {/* Card 3: Output Tokens */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e1dfdd",
                  borderRadius: "12px",
                  padding: "18px 16px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "600", color: "#605e5c" }}>Output Tokens</span>
                  <div style={{ padding: "6px", backgroundColor: "#e6f4f8", borderRadius: "8px" }}>
                    <TrendingUp style={{ width: "16px", height: "16px", color: "#54ACBF" }} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "22px", fontWeight: "700", fontFamily: "'Fira Code', Consolas, monospace", color: "#323130" }}>
                    {formatNumber(telemetry.total_completion_tokens)}
                  </div>
                </div>
              </div>

              {/* Card 4: Cached Tokens */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e1dfdd",
                  borderRadius: "12px",
                  padding: "18px 16px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "600", color: "#605e5c" }}>Cached Tokens</span>
                  <div style={{ padding: "6px", backgroundColor: "#fdf3eb", borderRadius: "8px" }}>
                    <Database style={{ width: "16px", height: "16px", color: "#E06D53" }} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "22px", fontWeight: "700", fontFamily: "'Fira Code', Consolas, monospace", color: "#323130" }}>
                    {formatNumber(telemetry.cached_tokens)}
                  </div>
                </div>
              </div>

              {/* Card 5: Active Accounts */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e1dfdd",
                  borderRadius: "12px",
                  padding: "18px 16px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "600", color: "#605e5c" }}>Active Accounts</span>
                  <div style={{ padding: "6px", backgroundColor: "#f3eefa", borderRadius: "8px" }}>
                    <Users style={{ width: "16px", height: "16px", color: "#9B51E0" }} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "22px", fontWeight: "700", fontFamily: "'Fira Code', Consolas, monospace", color: "#323130" }}>
                    {telemetry.active_accounts_count}
                  </div>
                </div>
              </div>

              {/* Card 6: Models Used */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e1dfdd",
                  borderRadius: "12px",
                  padding: "18px 16px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "600", color: "#605e5c" }}>Models Used</span>
                  <div style={{ padding: "6px", backgroundColor: "#efe5ef", borderRadius: "8px" }}>
                    <Cpu style={{ width: "16px", height: "16px", color: "#742774" }} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "22px", fontWeight: "700", fontFamily: "'Fira Code', Consolas, monospace", color: "#323130" }}>
                    {telemetry.models_used_count}
                  </div>
                </div>
              </div>
            </div>

            {/* MAIN TREND GRAPH & DONUT CHART ROW */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
              {/* MODEL USAGE TREND GRAPH */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e1dfdd",
                  borderRadius: "12px",
                  padding: "24px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.02)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <h3 style={{ fontSize: "16px", fontWeight: "700", margin: 0, color: "#323130" }}>
                      Model Usage Trend
                    </h3>
                    <p style={{ fontSize: "12px", color: "#605e5c", margin: "2px 0 0 0" }}>
                      Historical volume curve over selected timeframe
                    </p>
                  </div>

                  {/* View Mode (By Model / By Account) */}
                  <div style={{ display: "flex", backgroundColor: "#f3f2f1", padding: "2px", borderRadius: "6px" }}>
                    <Button
                      variant={trendView === "model" ? "primary" : "ghost"}
                      size="sm"
                      onClick={() => setTrendView("model")}
                    >
                      By Model
                    </Button>
                    <Button
                      variant={trendView === "account" ? "primary" : "ghost"}
                      size="sm"
                      onClick={() => setTrendView("account")}
                    >
                      By Account
                    </Button>
                  </div>
                </div>

                {/* DYNAMIC MODEL USAGE TREND GRAPH */}
                <ModelUsageTrendGraph
                  data={telemetry.daily_history}
                  modelSeries={telemetry.model_series}
                  modelBreakdown={telemetry.model_breakdown}
                  accountBreakdown={telemetry.account_breakdown}
                  trendView={trendView}
                  timeRange={timeRange}
                />
              </div>

              {/* BY ACCOUNT DONUT CHART */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e1dfdd",
                  borderRadius: "12px",
                  padding: "24px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                  display: "flex",
                  flexDirection: "column"
                }}
              >
                <h3 style={{ fontSize: "16px", fontWeight: "700", margin: "0 0 4px 0", color: "#323130" }}>
                  By Account Distribution
                </h3>
                <p style={{ fontSize: "12px", color: "#605e5c", margin: "0 0 16px 0" }}>
                  Token consumption share by department
                </p>

                {/* DYNAMIC SVG DONUT RING */}
                <AccountDonutChart accounts={telemetry.account_breakdown} />

                {/* DONUT LEGEND LIST */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", overflowY: "auto", flexGrow: 1 }}>
                  {telemetry.account_breakdown.map((acc, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                        <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: GRAPH_COLORS[i % GRAPH_COLORS.length], flexShrink: 0 }} />
                        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#323130", fontWeight: "500" }}>
                          {acc.name}
                        </span>
                      </div>
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: "700", color: "#605e5c" }}>
                        {acc.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* TOKEN USAGE BAR CHART & MODEL BREAKDOWN TABLE */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "20px" }}>
              {/* TOKEN USAGE BAR CHART (GROUPED 3-BAR SVG CHART) */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e1dfdd",
                  borderRadius: "12px",
                  padding: "24px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: "700", margin: "0 0 4px 0", color: "#323130" }}>
                    Token Distribution
                  </h3>
                  <p style={{ fontSize: "12px", color: "#605e5c", margin: "0 0 20px 0" }}>
                    Input, Cached, and Output composition per active date
                  </p>

                  {/* DYNAMIC TOKEN USAGE BAR CHART */}
                  <TokenUsageTrendBarChart data={telemetry.daily_history} timeRange={timeRange} />
                </div>

                <div style={{ padding: "12px", backgroundColor: "#faf9f8", borderRadius: "8px", border: "1px solid #edebe9", marginTop: "14px" }}>
                  <div style={{ fontSize: "11px", color: "#605e5c", lineHeight: "1.4" }}>
                    <strong style={{ color: "#323130" }}>Cache Efficiency:</strong> High prompt caching reduces latency and token consumption by up to 24%.
                  </div>
                </div>
              </div>

              {/* MODEL BREAKDOWN TABLE */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e1dfdd",
                  borderRadius: "12px",
                  padding: "24px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.02)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                  <div>
                    <h3 style={{ fontSize: "16px", fontWeight: "700", margin: 0, color: "#323130" }}>
                      Model Breakdown Table
                    </h3>
                    <p style={{ fontSize: "12px", color: "#605e5c", margin: "2px 0 0 0" }}>
                      Detailed prompt, completion, and cache stats per LLM model
                    </p>
                  </div>

                  <span style={{ fontSize: "11px", fontWeight: "600", padding: "4px 8px", backgroundColor: "#efe5ef", color: "#742774", borderRadius: "4px" }}>
                    {telemetry.model_breakdown.length} Models Active
                  </span>
                </div>

                {/* TABLE CONTENT */}
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #e1dfdd", color: "#605e5c", fontWeight: "600", backgroundColor: "#faf9f8" }}>
                        <th style={{ padding: "10px 14px" }}>Model Name</th>
                        <th style={{ padding: "10px 14px", textAlign: "right" }}>Requests</th>
                        <th style={{ padding: "10px 14px", textAlign: "right" }}>Input</th>
                        <th style={{ padding: "10px 14px", textAlign: "right" }}>Output</th>
                        <th style={{ padding: "10px 14px", textAlign: "right" }}>Cached</th>
                        <th style={{ padding: "10px 14px", textAlign: "right" }}>Total</th>
                        <th style={{ padding: "10px 14px", width: "140px" }}>Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {telemetry.model_breakdown.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ padding: "20px", textAlign: "center", color: "#605e5c", fontStyle: "italic" }}>
                            No model breakdown telemetry logged.
                          </td>
                        </tr>
                      ) : (() => {
                        const totalAll = telemetry.model_breakdown.reduce((sum, item) => sum + (item.total_tokens || 0), 0);
                        const denom = Math.max(totalAll, 1);
                        const sortedModels = [...telemetry.model_breakdown]
                          .map((m) => {
                            const calculatedPct = Math.round(((m.total_tokens || 0) / denom) * 1000) / 10;
                            return { ...m, percentage: calculatedPct };
                          })
                          .sort((a, b) => (b.total_tokens || 0) - (a.total_tokens || 0));

                        return sortedModels.map((m, idx) => {
                          const barColor = GRAPH_COLORS[idx % GRAPH_COLORS.length];
                          return (
                            <tr
                              key={idx}
                              style={{ borderBottom: "1px solid #f3f2f1", transition: "background-color 0.15s" }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#faf9f8")}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                            >
                              <td style={{ padding: "12px 14px", fontWeight: "600", color: "#323130" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <Cpu style={{ width: "15px", height: "15px", color: barColor }} />
                                  <span>{m.model_name}</span>
                                </div>
                              </td>
                              <td style={{ padding: "12px 14px", textAlign: "right", fontFamily: "var(--font-mono)", color: "#605e5c" }}>
                                {m.requests.toLocaleString()}
                              </td>
                              <td style={{ padding: "12px 14px", textAlign: "right", fontFamily: "var(--font-mono)", color: "#742774", fontWeight: "600" }}>
                                {formatNumber(m.input_tokens)}
                              </td>
                              <td style={{ padding: "12px 14px", textAlign: "right", fontFamily: "var(--font-mono)", color: "#9b51e0", fontWeight: "600" }}>
                                {formatNumber(m.output_tokens)}
                              </td>
                              <td style={{ padding: "12px 14px", textAlign: "right", fontFamily: "var(--font-mono)", color: "#742774", fontWeight: "600" }}>
                                {formatNumber(m.cached_tokens)}
                              </td>
                              <td style={{ padding: "12px 14px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: "700", color: "#323130" }}>
                                {formatNumber(m.total_tokens)}
                              </td>
                              <td style={{ padding: "12px 14px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%" }}>
                                  <div style={{ flexGrow: 1, height: "7px", backgroundColor: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                                    <div
                                      style={{
                                        height: "100%",
                                        width: `${Math.min(Math.max(m.percentage, m.total_tokens > 0 ? 1 : 0), 100)}%`,
                                        backgroundColor: barColor,
                                        borderRadius: "4px",
                                        transition: "width 0.3s ease"
                                      }}
                                    />
                                  </div>
                                  <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", fontWeight: "600", color: "#475569", minWidth: "40px", textAlign: "right" }}>
                                    {m.percentage.toFixed(1)}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 2: SYSTEM MODULES GRID                           */}
        {/* ---------------------------------------------------- */}
        {activeTab === "modules" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
            {/* Module 1: Knowledge Base */}
            <Link href="/dashboard/knowledge" style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", height: "100%" }}>
              <div
                style={{
                  flex: 1,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  backgroundColor: "#ffffff",
                  border: "1px solid #e1dfdd",
                  borderRadius: "12px",
                  padding: "24px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                  transition: "all 0.2s ease",
                  cursor: "pointer"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.borderColor = "#c7b2c7";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(116,39,116,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.borderColor = "#e1dfdd";
                  e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.02)";
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                    <div style={{ padding: "10px", backgroundColor: "#efe5ef", borderRadius: "10px" }}>
                      <BookOpen style={{ width: "24px", height: "24px", color: "#742774" }} />
                    </div>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#742774" }}>
                      {data?.knowledge?.active_documents || 2} Active Docs
                    </span>
                  </div>
                  <h3 style={{ fontSize: "16px", fontWeight: "700", margin: "0 0 6px 0", color: "#323130" }}>Knowledge Base</h3>
                  <p style={{ fontSize: "13px", color: "#605e5c", margin: 0, lineHeight: "1.4" }}>
                    Manage vector collections, document embeddings, and RAG knowledge sources.
                  </p>
                </div>
              </div>
            </Link>

            {/* Module 2: Channels */}
            <Link href="/dashboard/channel" style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", height: "100%" }}>
              <div
                style={{
                  flex: 1,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  backgroundColor: "#ffffff",
                  border: "1px solid #e1dfdd",
                  borderRadius: "12px",
                  padding: "24px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                  transition: "all 0.2s ease",
                  cursor: "pointer"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.borderColor = "#c7b2c7";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(116,39,116,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.borderColor = "#e1dfdd";
                  e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.02)";
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                    <div style={{ padding: "10px", backgroundColor: "#efe5ef", borderRadius: "10px" }}>
                      <GitBranch style={{ width: "24px", height: "24px", color: "#742774" }} />
                    </div>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#742774" }}>
                      {data?.channel?.whatsapp_status === "CONNECTED" ? "WhatsApp Connected" : "Channels Ready"}
                    </span>
                  </div>
                  <h3 style={{ fontSize: "16px", fontWeight: "700", margin: "0 0 6px 0", color: "#323130" }}>Channel Integrations</h3>
                  <p style={{ fontSize: "13px", color: "#605e5c", margin: 0, lineHeight: "1.4" }}>
                    Connect WhatsApp Baileys, Telegram bots, and web chat widgets.
                  </p>
                </div>
              </div>
            </Link>

            {/* Module 3: Conversations */}
            <Link href="/dashboard/conversations" style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", height: "100%" }}>
              <div
                style={{
                  flex: 1,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  backgroundColor: "#ffffff",
                  border: "1px solid #e1dfdd",
                  borderRadius: "12px",
                  padding: "24px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                  transition: "all 0.2s ease",
                  cursor: "pointer"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.borderColor = "#c7b2c7";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(116,39,116,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.borderColor = "#e1dfdd";
                  e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.02)";
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                    <div style={{ padding: "10px", backgroundColor: "#efe5ef", borderRadius: "10px" }}>
                      <MessageSquare style={{ width: "24px", height: "24px", color: "#742774" }} />
                    </div>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#742774" }}>
                      {data?.conversations?.total || 90} Convs Total
                    </span>
                  </div>
                  <h3 style={{ fontSize: "16px", fontWeight: "700", margin: "0 0 6px 0", color: "#323130" }}>Conversations & CS Agent</h3>
                  <p style={{ fontSize: "13px", color: "#605e5c", margin: 0, lineHeight: "1.4" }}>
                    Monitor live chat sessions, agent takeovers, and customer ticket status.
                  </p>
                </div>
              </div>
            </Link>

            {/* Module 4: Tools & MCP */}
            <Link href="/dashboard/tools" style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", height: "100%" }}>
              <div
                style={{
                  flex: 1,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  backgroundColor: "#ffffff",
                  border: "1px solid #e1dfdd",
                  borderRadius: "12px",
                  padding: "24px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                  transition: "all 0.2s ease",
                  cursor: "pointer"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.borderColor = "#c7b2c7";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(116,39,116,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.borderColor = "#e1dfdd";
                  e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.02)";
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                    <div style={{ padding: "10px", backgroundColor: "#efe5ef", borderRadius: "10px" }}>
                      <Wrench style={{ width: "24px", height: "24px", color: "#742774" }} />
                    </div>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#742774" }}>
                      {data?.tools?.enabled_tools || 3} Active Tools
                    </span>
                  </div>
                  <h3 style={{ fontSize: "16px", fontWeight: "700", margin: "0 0 6px 0", color: "#323130" }}>Tools & MCP Hub</h3>
                  <p style={{ fontSize: "13px", color: "#605e5c", margin: 0, lineHeight: "1.4" }}>
                    Configure Model Context Protocol servers and custom function calls.
                  </p>
                </div>
              </div>
            </Link>

            {/* Module 5: AI Providers */}
            <Link href="/dashboard/providers" style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", height: "100%" }}>
              <div
                style={{
                  flex: 1,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  backgroundColor: "#ffffff",
                  border: "1px solid #e1dfdd",
                  borderRadius: "12px",
                  padding: "24px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                  transition: "all 0.2s ease",
                  cursor: "pointer"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.borderColor = "#c7b2c7";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(116,39,116,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.borderColor = "#e1dfdd";
                  e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.02)";
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                    <div style={{ padding: "10px", backgroundColor: "#efe5ef", borderRadius: "10px" }}>
                      <Sparkles style={{ width: "24px", height: "24px", color: "#742774" }} />
                    </div>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#742774" }}>
                      {data?.providers?.active_providers || 4} Providers Active
                    </span>
                  </div>
                  <h3 style={{ fontSize: "16px", fontWeight: "700", margin: "0 0 6px 0", color: "#323130" }}>AI Model Providers</h3>
                  <p style={{ fontSize: "13px", color: "#605e5c", margin: 0, lineHeight: "1.4" }}>
                    Manage Gemini, OpenAI, Claude, and local Ollama API keys.
                  </p>
                </div>
              </div>
            </Link>

            {/* Module 6: User Management */}
            <Link href="/dashboard/users" style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", height: "100%" }}>
              <div
                style={{
                  flex: 1,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  backgroundColor: "#ffffff",
                  border: "1px solid #e1dfdd",
                  borderRadius: "12px",
                  padding: "24px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                  transition: "all 0.2s ease",
                  cursor: "pointer"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.borderColor = "#c7b2c7";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(116,39,116,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.borderColor = "#e1dfdd";
                  e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.02)";
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                    <div style={{ padding: "10px", backgroundColor: "#efe5ef", borderRadius: "10px" }}>
                      <Users style={{ width: "24px", height: "24px", color: "#742774" }} />
                    </div>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#742774" }}>
                      {data?.users?.total_users || 8} Accounts
                    </span>
                  </div>
                  <h3 style={{ fontSize: "16px", fontWeight: "700", margin: "0 0 6px 0", color: "#323130" }}>User & Access Control</h3>
                  <p style={{ fontSize: "13px", color: "#605e5c", margin: 0, lineHeight: "1.4" }}>
                    Assign roles (ADMIN, CS_AGENT, CUSTOMER) and access permissions.
                  </p>
                </div>
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
