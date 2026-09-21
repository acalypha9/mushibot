"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  ClipboardList,
  Layout,
  Sparkles,
  GitBranch,
  MoreHorizontal,
  MessageSquare,
  Menu,
} from "lucide-react";

interface DashboardSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  userRole?: string;
}

interface NavItem {
  label: string;
  href: string;
  Icon: React.ComponentType<{ style?: React.CSSProperties }>;
}

export default function DashboardSidebar({
  isCollapsed,
  onToggleCollapse,
  userRole,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  const mainNavItems: NavItem[] = [
    { label: "Home", href: "/dashboard", Icon: Home },
    { label: "Channel", href: "/dashboard/channel", Icon: GitBranch },
    { label: "Knowledge", href: "/dashboard/knowledge", Icon: BookOpen },
    { label: "Conversations", href: "/dashboard/conversations", Icon: ClipboardList },
    { label: "Tools", href: "/dashboard/tools", Icon: Layout },
  ];

  if (userRole === "ADMIN") {
    mainNavItems.push({ label: "AI Providers", href: "/dashboard/providers", Icon: Sparkles });
    mainNavItems.push({ label: "Accounts", href: "/dashboard/users", Icon: MoreHorizontal });
  }

  return (
    <aside
      aria-label="Dashboard navigation"
      style={{
        width: isCollapsed ? "48px" : "200px",
        backgroundColor: "#f3f2f1",
        borderRight: "1px solid #e1dfdd",
        boxShadow: "3px 0 12px -2px rgba(0, 0, 0, 0.07), 1px 0 3px -1px rgba(0, 0, 0, 0.04)",
        position: "relative",
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        transition: "width 0.2s ease-in-out",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          height: "44px",
          padding: isCollapsed ? "0" : "0 12.5px",
          display: "flex",
          alignItems: "center",
          justifyContent: isCollapsed ? "center" : "flex-start",
          boxSizing: "border-box",
        }}
      >
        <button
          type="button"
          onClick={onToggleCollapse}
          title={isCollapsed ? "Expand menu" : "Collapse menu"}
          aria-label={isCollapsed ? "Expand menu" : "Collapse menu"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "36px",
            height: "36px",
            padding: 0,
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)",
            backgroundColor: "transparent",
            color: "var(--foreground)",
            cursor: "pointer",
            transition: "all 0.15s ease",
            boxSizing: "border-box",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--muted)";
            e.currentTarget.style.color = "var(--primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "var(--foreground)";
          }}
        >
          <Menu style={{ width: "17px", height: "17px" }} />
        </button>
      </div>

      <nav
        style={{
          flexGrow: 1,
          padding: "8px",
          display: "flex",
          flexDirection: "column",
          gap: "3px",
        }}
      >
        {mainNavItems.map((item) => {
          const isActive = pathname === item.href;
          const IconComp = item.Icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                height: "38px",
                padding: isCollapsed ? "0 8px" : "0 14px",
                justifyContent: isCollapsed ? "center" : "flex-start",
                borderRadius: "var(--radius-sm)",
                textDecoration: "none",
                fontSize: "13px",
                fontWeight: isActive ? "700" : "500",
                color: isActive ? "var(--primary)" : "var(--foreground)",
                backgroundColor: isActive ? "var(--accent)" : "transparent",
                transition: "all 0.15s ease",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = "rgba(116, 39, 116, 0.06)";
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              {isActive && (
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "6px",
                    bottom: "6px",
                    width: "3.5px",
                    backgroundColor: "var(--primary)",
                    borderRadius: "0 3px 3px 0",
                  }}
                />
              )}
              <IconComp
                style={{
                  width: "17px",
                  height: "17px",
                  color: isActive ? "var(--primary)" : "var(--muted-foreground)",
                  flexShrink: 0,
                }}
              />
              {!isCollapsed && <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: "8px", borderTop: "1px solid #e1dfdd" }}>
        <Link
          href="/chat"
          title={isCollapsed ? "Conversation" : undefined}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            height: "38px",
            padding: isCollapsed ? "0 8px" : "0 14px",
            justifyContent: isCollapsed ? "center" : "flex-start",
            borderRadius: "var(--radius-sm)",
            textDecoration: "none",
            fontSize: "13px",
            fontWeight: "500",
            color: "var(--foreground)",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(116, 39, 116, 0.06)";
            e.currentTarget.style.color = "var(--primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "var(--foreground)";
          }}
        >
          <MessageSquare style={{ width: "17px", height: "17px", color: "var(--muted-foreground)", flexShrink: 0 }} />
          {!isCollapsed && <span style={{ whiteSpace: "nowrap" }}>Conversation</span>}
        </Link>
      </div>
    </aside>
  );
}
