"use client";

import React from "react";
import Image from "next/image";
import { Plus, MoreVertical, Pin, Pencil, Trash2, Menu, MessageSquare, LogOut } from "lucide-react";

export interface Conversation {
  id: string;
  status: string;
  title?: string;
  summary?: string;
  is_pinned?: boolean;
  created_at: string;
}

export function getConversationTitle(conv: { title?: string; summary?: string; id: string }): string {
  return conv.title || conv.summary || `Session #${conv.id.substring(0, 8)}`;
}

export interface ChatSidebarProps {
  className?: string;
  conversations: Conversation[];
  activeConvId: string | null;
  isSidebarCollapsed: boolean;
  menuOpenId: string | null;
  menuRef: React.RefObject<HTMLDivElement | null>;
  onToggleSidebar: () => void;
  onCreateConversation: () => void;
  onSelectConversation: (conv: Conversation) => void;
  onToggleMenu: (id: string | null) => void;
  onTogglePin: (conv: Conversation, e: React.MouseEvent) => void;
  onStartRename: (conv: Conversation, e: React.MouseEvent) => void;
  onDeleteConversation: (convId: string, e: React.MouseEvent) => void;
  onLogout?: () => void;
  user?: { email?: string; full_name?: string; role?: string } | null;
}

const styles = {
  menuItem: {
    display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "6px 10px",
    border: "none", borderRadius: "4px", background: "transparent", color: "#323130",
    fontSize: "13px", fontWeight: "500", cursor: "pointer", textAlign: "left" as const,
    transition: "background 0.15s ease",
  },
  dropdown: {
    position: "absolute" as const, top: "24px", right: 0, zIndex: 999, width: "160px",
    background: "#ffffff", border: "1px solid #e1dfdd", borderRadius: "8px", padding: "4px",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12)", display: "flex", flexDirection: "column" as const, gap: "2px",
  },
  collapsedBtn: {
    width: "44px", height: "44px", borderRadius: "12px", border: "1px solid var(--border)",
    background: "var(--card)", color: "var(--primary)", cursor: "pointer", display: "flex",
    alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
    transition: "all 0.2s ease",
  },
  collapseToggleBtn: {
    background: "none", border: "1px solid var(--border)", borderRadius: "6px",
    padding: "4px 6px", color: "var(--muted-foreground)", cursor: "pointer",
    display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s ease",
  },
  expandToggleBtn: {
    background: "none", border: "1px solid var(--border)", borderRadius: "6px",
    padding: "6px", color: "var(--muted-foreground)", cursor: "pointer",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
  },
  recentsLabel: {
    fontSize: "11px", fontWeight: "800", color: "var(--muted-foreground)",
    textTransform: "uppercase" as const, letterSpacing: "0.06em",
  },
  dotsBtn: {
    background: "transparent", border: "none", cursor: "pointer", padding: "4px",
    borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center",
    transition: "color 0.15s ease",
  },
};

export function ChatSidebar({
  className,
  conversations, activeConvId, isSidebarCollapsed, menuOpenId, menuRef,
  onToggleSidebar, onCreateConversation, onSelectConversation, onToggleMenu,
  onTogglePin, onStartRename, onDeleteConversation, onLogout, user,
}: ChatSidebarProps) {
  const visibleConversations = conversations.filter((c) => c.id !== "new");

  return (
    <aside
      className={className}
      aria-label="Chat Sessions"
      style={{
        width: isSidebarCollapsed ? "68px" : "260px",
        transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        flexShrink: 0, borderRight: "1px solid var(--border)", background: "var(--muted)",
        padding: isSidebarCollapsed ? "12px 8px" : "14px 16px",
        display: "flex", flexDirection: "column", gap: "12px", overflow: "hidden",
      }}
    >
      <div style={{
        display: "flex", justifyContent: isSidebarCollapsed ? "center" : "space-between",
        alignItems: "center", paddingBottom: "8px", borderBottom: "1px solid var(--border)", width: "100%",
      }}>
        {!isSidebarCollapsed ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Image
                src="/mushibot-logo.png"
                alt="MushiBot Logo"
                width={22}
                height={22}
                priority
                style={{ objectFit: "contain" }}
              />
              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: "bold", fontSize: "16px", margin: 0, letterSpacing: "-0.01em" }}>
                Chat
              </h1>
            </div>
            <button onClick={onToggleSidebar} style={styles.collapseToggleBtn} title="Collapse Sidebar" aria-label="Collapse Sidebar">
              <Menu style={{ width: "16px", height: "16px" }} />
            </button>
          </>
        ) : (
          <button onClick={onToggleSidebar} style={styles.expandToggleBtn} title="Expand Sidebar" aria-label="Expand Sidebar">
            <Image
              src="/mushibot-logo.png"
              alt="MushiBot Logo"
              width={22}
              height={22}
              priority
              style={{ objectFit: "contain" }}
            />
          </button>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: isSidebarCollapsed ? "center" : "space-between", alignItems: "center" }}>
        {!isSidebarCollapsed && <span style={styles.recentsLabel}>RECENTS</span>}
        <button
          onClick={onCreateConversation}
          title={isSidebarCollapsed ? "New Chat" : undefined}
          aria-label="New Chat"
          className="ui-btn ui-btn-primary"
          style={{
            borderRadius: isSidebarCollapsed ? "50%" : "var(--radius-sm)",
            padding: isSidebarCollapsed ? "9px" : "6px 12px",
            fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "11.5px", letterSpacing: "0.02em",
          }}
        >
          <Plus style={{ width: "14px", height: "14px" }} />
          {!isSidebarCollapsed && <span>NEW CHAT</span>}
        </button>
      </div>

      <div style={{ flexGrow: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
        {isSidebarCollapsed ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "8px" }}>
            <button
              onClick={onToggleSidebar}
              title="Open Conversations"
              aria-label="Open Conversations"
              style={styles.collapsedBtn}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.background = "var(--color-status-soft)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--card)"; }}
            >
              <MessageSquare style={{ width: "20px", height: "20px" }} />
            </button>
          </div>
        ) : visibleConversations.length === 0 ? (
          <div style={{ padding: "var(--space-3) 0", textAlign: "center", color: "var(--muted-foreground)", fontSize: "13px" }}>
            No active support sessions.
          </div>
        ) : (
          visibleConversations.map((c) => {
            const isActive = activeConvId === c.id;
            const isMenuOpen = menuOpenId === c.id;
            const titleText = getConversationTitle(c);

            return (
              <div
                key={c.id}
                onClick={() => onSelectConversation(c)}
                style={{
                  position: "relative", padding: "10px 12px", borderRadius: "var(--radius-md)",
                  border: isActive ? "1px solid var(--secondary)" : "1px solid var(--border)",
                  background: isActive ? "var(--color-status-soft)" : "var(--card)",
                  color: "var(--foreground)", cursor: "pointer", fontFamily: "var(--font-body)",
                  display: "flex", flexDirection: "column", gap: "4px",
                  boxShadow: isActive ? "var(--shadow-sm)" : "none", transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.borderColor = "var(--secondary)"; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.borderColor = "var(--border)"; }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", width: "100%" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", overflow: "hidden", flex: 1 }}>
                    {c.is_pinned && <Pin style={{ width: "12px", height: "12px", color: "#742774", flexShrink: 0, transform: "rotate(45deg)" }} />}
                    <span
                      title={titleText}
                      style={{
                        fontWeight: "bold", fontSize: "12.5px", whiteSpace: "nowrap",
                        overflow: "hidden", textOverflow: "ellipsis", color: "var(--foreground)",
                      }}
                    >
                      {titleText}
                    </span>
                  </div>

                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleMenu(isMenuOpen ? null : c.id); }}
                      style={{ ...styles.dotsBtn, color: isMenuOpen ? "#742774" : "var(--muted-foreground)" }}
                      title="Options"
                      aria-label="Options"
                      onMouseEnter={(e) => e.currentTarget.style.color = "#742774"}
                      onMouseLeave={(e) => { if (!isMenuOpen) e.currentTarget.style.color = "var(--muted-foreground)"; }}
                    >
                      <MoreVertical style={{ width: "14px", height: "14px" }} />
                    </button>

                    {isMenuOpen && (
                      <div ref={menuRef} style={styles.dropdown} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => onTogglePin(c, e)}
                          style={styles.menuItem}
                          onMouseEnter={(e) => e.currentTarget.style.background = "#f3f2f1"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                        >
                          <Pin style={{ width: "14px", height: "14px", color: c.is_pinned ? "#742774" : "#605e5c" }} />
                          <span>{c.is_pinned ? "Unpin" : "Pin"}</span>
                        </button>
                        <button
                          onClick={(e) => onStartRename(c, e)}
                          style={styles.menuItem}
                          onMouseEnter={(e) => e.currentTarget.style.background = "#f3f2f1"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                        >
                          <Pencil style={{ width: "14px", height: "14px", color: "#605e5c" }} />
                          <span>Rename</span>
                        </button>
                        <button
                          onClick={(e) => onDeleteConversation(c.id, e)}
                          style={{ ...styles.menuItem, color: "#a4262c" }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "#fde8e8"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                        >
                          <Trash2 style={{ width: "14px", height: "14px", color: "#a4262c" }} />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginTop: "2px" }}>
                  <span style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                  <span style={{
                    fontSize: "9px", padding: "1px 6px",
                    background: c.status === "ACTIVE" ? "var(--color-status-soft)" : "var(--muted)",
                    color: c.status === "ACTIVE" ? "var(--foreground)" : "var(--muted-foreground)",
                    borderRadius: "10px", fontWeight: "bold",
                  }}>
                    {c.status}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {onLogout && (
        <div
          style={{
            borderTop: "1px solid var(--border)",
            paddingTop: "10px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            flexShrink: 0,
          }}
        >
          {!isSidebarCollapsed && user && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2px", overflow: "hidden", padding: "0 2px" }}>
              <span
                title={user.full_name || "User"}
                style={{
                  fontSize: "12.5px",
                  fontWeight: "700",
                  color: "var(--foreground)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {user.full_name || "User"}
              </span>
              <span
                title={user.email || ""}
                style={{
                  fontSize: "11px",
                  color: "var(--muted-foreground)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {user.email || ""}
              </span>
            </div>
          )}
          {user?.role !== "ADMIN" && (
            <button
              onClick={onLogout}
              title="Log Out"
              aria-label="Log Out"
              className="ui-btn ui-btn-outline"
              style={{
                width: "100%",
                justifyContent: isSidebarCollapsed ? "center" : "flex-start",
                padding: isSidebarCollapsed ? "8px" : "7px 12px",
                gap: "8px",
                fontSize: "12px",
                fontWeight: "600",
              }}
            >
              <LogOut style={{ width: "15px", height: "15px" }} />
              {!isSidebarCollapsed && <span>Log Out</span>}
            </button>
          )}
        </div>
      )}
    </aside>
  );
}
