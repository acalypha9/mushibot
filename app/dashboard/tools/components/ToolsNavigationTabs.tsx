"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { Wrench, Cpu, Clock } from "lucide-react";
import styles from "./RemindersTab.module.css";

interface ToolsNavigationTabsProps {
  mainTab: "function_tools" | "mcp" | "reminders";
  setMainTab: (tab: "function_tools" | "mcp" | "reminders") => void;
}

export default function ToolsNavigationTabs({ mainTab, setMainTab }: ToolsNavigationTabsProps) {
  const tabs = [
    { id: "function_tools" as const, label: "Function Tools", icon: Wrench },
    { id: "mcp" as const, label: "MCP", icon: Cpu },
    { id: "reminders" as const, label: "Reminders", icon: Clock },
  ];

  return (
    <div className={styles.toolsTabs} style={{ display: "flex", borderBottom: "1px solid #e1dfdd", gap: "24px" }}>
      {tabs.map((tab) => {
        const IconComp = tab.icon;
        const isActive = mainTab === tab.id;
        return (
          <Button
            key={tab.id}
            variant="ghost"
            onClick={() => setMainTab(tab.id)}
            style={{
              borderBottom: isActive ? "2px solid #742774" : "2px solid transparent",
              color: isActive ? "#742774" : "#605e5c",
              fontWeight: isActive ? "600" : "400",
              fontSize: "15px",
              borderRadius: 0,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <IconComp style={{ width: "18px", height: "18px" }} />
            <span>{tab.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
