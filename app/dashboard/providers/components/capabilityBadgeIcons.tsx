import React from "react";
import {
  FileText,
  Layers,
  Info,
  Image as ImageIcon,
  Mic,
  Wrench,
  Brain,
  Unlock
} from "lucide-react";
import type { CapabilityBadgeItem } from "./modelCapabilityFormatter";

export function renderCapabilityBadgeIcon(iconType: CapabilityBadgeItem["iconType"]): React.ReactNode {
  switch (iconType) {
    case "parser":
      return <FileText style={{ width: "13px", height: "13px", color: "#0284c7" }} />;
    case "embedding":
      return <Layers style={{ width: "13px", height: "13px", color: "#0284c7" }} />;
    case "info":
      return <Info style={{ width: "13px", height: "13px", color: "#64748b" }} />;
    case "vision":
      return <ImageIcon style={{ width: "13px", height: "13px", color: "#3b82f6" }} />;
    case "audio":
      return <Mic style={{ width: "13px", height: "13px", color: "#ec4899" }} />;
    case "tools":
      return <Wrench style={{ width: "13px", height: "13px", color: "#f59e0b" }} />;
    case "reasoning":
      return <Brain style={{ width: "13px", height: "13px", color: "#8b5cf6" }} />;
    case "structured":
      return <FileText style={{ width: "13px", height: "13px", color: "#10b981" }} />;
    case "openWeights":
      return <Unlock style={{ width: "13px", height: "13px", color: "#6366f1" }} />;
    case "context":
      return null;
    default:
      return null;
  }
}
