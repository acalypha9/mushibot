"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Bell,
  Settings,
  LogOut,
  Check,
  AlertTriangle,
  X,
  RefreshCw,
} from "lucide-react";
import Button from "@/components/ui/Button";
import HeaderSearch from "@/components/HeaderSearch";
import type { User } from "../../auth";

interface DashboardHeaderProps {
  user: User;
  avatarUrl: string;
  onOpenSettings: () => void;
  onLogout: () => void;
}

export interface NotificationItem {
  id: string;
  type: "DOCUMENT" | "COLLECTION" | "REMINDER" | "USER" | "PROVIDER";
  action: "CREATED" | "UPDATED";
  title: string;
  description: string;
  timestamp: string | null;
  entity_id: string;
  parent_id: string | null;
  target_href: string;
}

function formatRelativeTime(isoString: string | null): string {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return "Just now";
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export default function DashboardHeader({
  user,
  avatarUrl,
  onOpenSettings,
  onLogout,
}: DashboardHeaderProps) {
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [filterTab, setFilterTab] = useState<"all" | "unread">("all");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  // Popup modal for non-existent/deleted entity
  const [alertPopup, setAlertPopup] = useState<{
    show: boolean;
    title: string;
    message: string;
  } | null>(null);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  // Load read notification IDs from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("csa_read_notifications");
      if (stored) {
        setReadIds(new Set(JSON.parse(stored)));
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoadingNotifs(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/notifications?limit=30", {
        headers,
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.items || []);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoadingNotifs(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 45000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Click outside listener for menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowUserMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(target)) {
        setShowNotifs(false);
      }
    };
    if (showUserMenu || showNotifs) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserMenu, showNotifs]);

  const markAllAsRead = () => {
    const allIds = new Set(notifications.map((n) => n.id));
    setReadIds(allIds);
    try {
      localStorage.setItem("csa_read_notifications", JSON.stringify(Array.from(allIds)));
    } catch {
      // ignore
    }
  };

  const markItemAsRead = (id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem("csa_read_notifications", JSON.stringify(Array.from(next)));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    setVerifyingId(notif.id);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const params = new URLSearchParams({
        type: notif.type,
        id: notif.entity_id,
      });
      if (notif.parent_id) params.set("parent_id", notif.parent_id);

      const res = await fetch(`/api/notifications/verify?${params.toString()}`, {
        headers,
        credentials: "include",
      });

      if (!res.ok) {
        setAlertPopup({
          show: true,
          title: "Item Not Found",
          message: "This item no longer exists or has been deleted.",
        });
        return;
      }

      const verifyData = await res.json();
      if (!verifyData.exists) {
        setAlertPopup({
          show: true,
          title: "Item Does Not Exist",
          message:
            verifyData.message ||
            `The item no longer exists or has been deleted.`,
        });
        return;
      }

      markItemAsRead(notif.id);
      setShowNotifs(false);

      if (notif.type === "COLLECTION") {
        window.dispatchEvent(
          new CustomEvent("select-knowledge-collection", {
            detail: { id: notif.entity_id },
          })
        );
      }

      router.push(notif.target_href);
    } catch (err) {
      console.error("Error verifying notification:", err);
      setAlertPopup({
        show: true,
        title: "Connection Error",
        message: "Unable to verify the status of this item. Please try again.",
      });
    } finally {
      setVerifyingId(null);
    }
  };

  const unreadCount = useMemo(
    () => notifications.filter((n) => !readIds.has(n.id)).length,
    [notifications, readIds]
  );

  const filteredNotifications = useMemo(() => {
    if (filterTab === "unread") {
      return notifications.filter((n) => !readIds.has(n.id));
    }
    return notifications;
  }, [notifications, filterTab, readIds]);

  const userInitials = user.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : "FS";

  const effectiveAvatar = avatarUrl || user.avatar_url;

  return (
    <>
      <header
        style={{
          height: "52px",
          backgroundColor: "#742774",
          boxShadow: "0 2px 8px rgba(116, 39, 116, 0.25)",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          flexShrink: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link
            href="/dashboard"
            style={{
              color: "#ffffff",
              textDecoration: "none",
              fontWeight: "800",
              fontSize: "17px",
              fontFamily: "var(--font-display)",
              letterSpacing: "-0.02em",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Image
              src="/mushibot-logo.png"
              alt="MushiBot Logo"
              width={26}
              height={26}
              priority
              style={{ objectFit: "contain", borderRadius: "4px" }}
            />
            <span>Mushibot</span>
          </Link>
        </div>

        <HeaderSearch onOpenSettings={onOpenSettings} />

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Notification Bell Button & Dropdown */}
          <div style={{ position: "relative" }} ref={notifMenuRef}>
            <button
              onClick={() => {
                setShowNotifs((prev) => !prev);
                setShowUserMenu(false);
                if (!showNotifs) fetchNotifications();
              }}
              title="Notifications"
              aria-label="Notifications"
              aria-expanded={showNotifs}
              style={{
                background: "transparent",
                color: "rgba(255, 255, 255, 0.9)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "8px",
                padding: "7px 9px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                transition: "all 0.15s ease",
              }}
            >
              <Bell style={{ width: "17px", height: "17px" }} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-4px",
                    right: "-4px",
                    backgroundColor: "#ef4444",
                    color: "#ffffff",
                    fontSize: "10px",
                    fontWeight: "700",
                    height: "17px",
                    minWidth: "17px",
                    borderRadius: "9px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 4px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
                    border: "2px solid #742774",
                  }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div
                role="region"
                aria-label="Notifications Panel"
                style={{
                  position: "absolute",
                  right: 0,
                  top: "44px",
                  width: "400px",
                  maxHeight: "500px",
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  boxShadow:
                    "0 12px 36px -4px rgba(0, 0, 0, 0.16), 0 4px 12px -2px rgba(0, 0, 0, 0.06)",
                  border: "1px solid #e5e7eb",
                  zIndex: 220,
                  color: "#1f2937",
                  fontFamily: "var(--font-body)",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  animation: "reveal 0.16s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                {/* Header with Title and Action Controls */}
                <div
                  style={{
                    padding: "14px 16px 10px 16px",
                    borderBottom: "1px solid #f3f4f6",
                    backgroundColor: "#ffffff",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span
                        style={{
                          fontWeight: "700",
                          fontSize: "15px",
                          fontFamily: "var(--font-display)",
                          color: "#111827",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        Notifications
                      </span>
                      {unreadCount > 0 && (
                        <span
                          style={{
                            backgroundColor: "#f3f4f6",
                            color: "#374151",
                            border: "1px solid #e5e7eb",
                            fontSize: "11px",
                            fontWeight: "600",
                            padding: "2px 7px",
                            borderRadius: "10px",
                          }}
                        >
                          {unreadCount} new
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <button
                        onClick={fetchNotifications}
                        disabled={loadingNotifs}
                        title="Refresh notifications"
                        style={{
                          background: "transparent",
                          border: "1px solid #e5e7eb",
                          cursor: "pointer",
                          color: "#4b5563",
                          width: "28px",
                          height: "28px",
                          borderRadius: "6px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#f9fafb";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <RefreshCw
                          style={{
                            width: "13px",
                            height: "13px",
                            animation: loadingNotifs ? "spin 1s linear infinite" : "none",
                          }}
                        />
                      </button>

                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          title="Mark all as read"
                          style={{
                            background: "transparent",
                            border: "1px solid #e5e7eb",
                            cursor: "pointer",
                            color: "#374151",
                            fontSize: "11.5px",
                            fontWeight: "600",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#f9fafb";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                          }}
                        >
                          <Check style={{ width: "12px", height: "12px" }} />
                          <span>Mark all read</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Clean Filter Tabs (All / Unread without parenthesis) */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "#f3f4f6",
                      padding: "3px",
                      borderRadius: "8px",
                      gap: "3px",
                    }}
                  >
                    <button
                      onClick={() => setFilterTab("all")}
                      style={{
                        flex: 1,
                        border: "none",
                        background: filterTab === "all" ? "#ffffff" : "transparent",
                        color: filterTab === "all" ? "#111827" : "#6b7280",
                        fontWeight: filterTab === "all" ? "700" : "500",
                        fontSize: "12px",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        boxShadow:
                          filterTab === "all" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                        transition: "all 0.15s ease",
                      }}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setFilterTab("unread")}
                      style={{
                        flex: 1,
                        border: "none",
                        background: filterTab === "unread" ? "#ffffff" : "transparent",
                        color: filterTab === "unread" ? "#111827" : "#6b7280",
                        fontWeight: filterTab === "unread" ? "700" : "500",
                        fontSize: "12px",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        boxShadow:
                          filterTab === "unread" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                        transition: "all 0.15s ease",
                      }}
                    >
                      Unread
                    </button>
                  </div>
                </div>

                {/* Notifications List */}
                <div
                  style={{
                    overflowY: "auto",
                    maxHeight: "360px",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {filteredNotifications.length === 0 ? (
                    <div
                      style={{
                        padding: "36px 20px",
                        textAlign: "center",
                        color: "#6b7280",
                        fontSize: "13px",
                        fontWeight: "500",
                      }}
                    >
                      {filterTab === "unread"
                        ? "No unread notifications"
                        : "No notifications"}
                    </div>
                  ) : (
                    filteredNotifications.map((notif) => {
                      const isUnread = !readIds.has(notif.id);
                      const isVerifying = verifyingId === notif.id;

                      return (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              handleNotificationClick(notif);
                            }
                          }}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            padding: "11px 16px",
                            cursor: isVerifying ? "wait" : "pointer",
                            backgroundColor: isUnread ? "#f9fafb" : "#ffffff",
                            borderLeft: isUnread
                              ? "3px solid #4b5563"
                              : "3px solid transparent",
                            borderBottom: "1px solid #f3f4f6",
                            transition: "all 0.12s ease",
                            opacity: isVerifying ? 0.6 : 1,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = isUnread
                              ? "#f3f4f6"
                              : "#f9fafb";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = isUnread
                              ? "#f9fafb"
                              : "#ffffff";
                          }}
                        >
                          {/* Row 1: Action Badge + Title + Timestamp */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: "8px",
                              marginBottom: "3px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                minWidth: 0,
                                flex: 1,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "9.5px",
                                  fontWeight: "700",
                                  padding: "1px 5px",
                                  borderRadius: "4px",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.4px",
                                  flexShrink: 0,
                                  backgroundColor: "#f3f4f6",
                                  color: "#374151",
                                  border: "1px solid #e5e7eb",
                                }}
                              >
                                {notif.action}
                              </span>
                              <span
                                style={{
                                  fontSize: "13px",
                                  fontWeight: isUnread ? "700" : "600",
                                  color: "#111827",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {notif.title}
                              </span>
                            </div>

                            <span
                              style={{
                                fontSize: "11px",
                                color: "#9ca3af",
                                flexShrink: 0,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {formatRelativeTime(notif.timestamp)}
                            </span>
                          </div>

                          {/* Row 2: Description */}
                          <div
                            style={{
                              fontSize: "11.5px",
                              color: "#6b7280",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              lineHeight: "1.3",
                            }}
                          >
                            {notif.description}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer Bar: Event Count only, no jump hint */}
                <div
                  style={{
                    padding: "9px 16px",
                    borderTop: "1px solid #f3f4f6",
                    backgroundColor: "#fbfafc",
                    fontSize: "11px",
                    color: "#6b7280",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span>
                    {filteredNotifications.length} event
                    {filteredNotifications.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div style={{ position: "relative" }} ref={userMenuRef}>
            <button
              onClick={() => {
                setShowUserMenu((prev) => !prev);
                setShowNotifs(false);
              }}
              title={user.full_name || "User Profile"}
              aria-label="User Profile Menu"
              aria-expanded={showUserMenu}
              aria-haspopup="menu"
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "10px",
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                border: "1px solid rgba(255, 255, 255, 0.35)",
                color: "#ffffff",
                fontWeight: "700",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: 0,
                overflow: "hidden",
                boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                transition: "all 0.2s ease",
              }}
            >
              {effectiveAvatar ? (
                <img
                  src={effectiveAvatar}
                  alt="Profile"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                userInitials
              )}
            </button>

            {showUserMenu && (
              <div
                role="menu"
                style={{
                  position: "absolute",
                  right: 0,
                  top: "44px",
                  width: "230px",
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  boxShadow:
                    "0 10px 30px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.06)",
                  border: "1px solid var(--border)",
                  padding: "14px",
                  zIndex: 200,
                  color: "#1c191f",
                  animation: "reveal 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                <div style={{ fontWeight: "700", fontSize: "14px", color: "#1c191f" }}>
                  {user.full_name || "User"}
                </div>
                <div
                  style={{
                    fontSize: "11.5px",
                    color: "var(--muted-foreground)",
                    marginBottom: "10px",
                  }}
                >
                  {user.role}
                </div>
                <hr
                  style={{
                    border: "none",
                    borderTop: "1px solid var(--border)",
                    margin: "8px 0",
                  }}
                />

                <Button
                  variant="ghost"
                  size="sm"
                  style={{ width: "100%", justifyContent: "flex-start", marginBottom: "6px" }}
                  onClick={() => {
                    setShowUserMenu(false);
                    onOpenSettings();
                  }}
                >
                  <Settings style={{ width: "15px", height: "15px" }} /> Settings
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  style={{
                    width: "100%",
                    justifyContent: "flex-start",
                    color: "#374151",
                  }}
                  onClick={() => {
                    onLogout();
                    router.replace("/login");
                  }}
                >
                  <LogOut style={{ width: "15px", height: "15px" }} /> Log out
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Floating Popup Alert for Non-Existent or Deleted Entity */}
      {alertPopup?.show && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="alert-dialog-title"
          style={{
            position: "fixed",
            top: "68px",
            right: "24px",
            maxWidth: "390px",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            boxShadow:
              "0 14px 40px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.08)",
            border: "1px solid #fee2e2",
            borderLeft: "5px solid #ef4444",
            padding: "16px",
            zIndex: 9999,
            display: "flex",
            gap: "12px",
            animation: "reveal 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: "#fef2f2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <AlertTriangle style={{ width: "20px", height: "20px", color: "#dc2626" }} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              id="alert-dialog-title"
              style={{
                fontWeight: "700",
                fontSize: "14px",
                color: "#991b1b",
                marginBottom: "4px",
              }}
            >
              {alertPopup.title}
            </div>
            <div style={{ fontSize: "12.5px", color: "#4b5563", lineHeight: "1.4" }}>
              {alertPopup.message}
            </div>
            <div
              style={{
                marginTop: "10px",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setAlertPopup(null)}
                style={{
                  backgroundColor: "#f3f4f6",
                  color: "#374151",
                  border: "none",
                  borderRadius: "6px",
                  padding: "5px 12px",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Dismiss
              </button>
            </div>
          </div>

          <button
            onClick={() => setAlertPopup(null)}
            style={{
              background: "none",
              border: "none",
              color: "#9ca3af",
              cursor: "pointer",
              padding: "2px",
              height: "fit-content",
            }}
          >
            <X style={{ width: "16px", height: "16px" }} />
          </button>
        </div>
      )}
    </>
  );
}
