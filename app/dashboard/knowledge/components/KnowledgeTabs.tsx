import React from "react";
import Button from "@/components/ui/Button";
import { BookOpen, FileText, Search, Settings } from "lucide-react";

export type KnowledgeTabId = "overview" | "documents" | "retrieval" | "settings";

interface KnowledgeTabsProps {
  activeTab: KnowledgeTabId;
  documentCount: number;
  onTabChange: (tabId: KnowledgeTabId) => void;
}

export default function KnowledgeTabs({
  activeTab,
  documentCount,
  onTabChange,
}: KnowledgeTabsProps) {
  const tabs = [
    { id: "overview" as const, label: "Overview", icon: BookOpen },
    { id: "documents" as const, label: "Documents", icon: FileText, count: documentCount },
    { id: "retrieval" as const, label: "Retrieval", icon: Search },
    { id: "settings" as const, label: "Settings", icon: Settings },
  ];

  return (
    <div style={{ display: "flex", borderBottom: "1px solid #e1dfdd", gap: "24px" }}>
      {tabs.map((tab) => {
        const IconComp = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <Button
            key={tab.id}
            variant="ghost"
            onClick={() => onTabChange(tab.id)}
            style={{
              padding: "12px 4px",
              border: "none",
              borderRadius: 0,
              borderBottom: isActive ? "2px solid #742774" : "2px solid transparent",
              color: isActive ? "#742774" : "#605e5c",
              fontWeight: isActive ? "600" : "400",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <IconComp style={{ width: "16px", height: "16px" }} />
            {tab.label}
            {tab.count !== undefined && (
              <span
                style={{
                  fontSize: "11px",
                  padding: "1px 7px",
                  background: isActive ? "#efe5ef" : "#f3f2f1",
                  color: isActive ? "#742774" : "#605e5c",
                  borderRadius: "10px",
                  fontWeight: "bold",
                }}
              >
                {tab.count}
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
}
