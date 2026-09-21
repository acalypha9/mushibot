"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../auth";
import { useEffect, useState, useTransition } from "react";
import { isTokenExpired } from "@/lib/api";
import DashboardSidebar from "./components/DashboardSidebar";
import DashboardHeader from "./components/DashboardHeader";
import ProfileSettingsModal from "./components/ProfileSettingsModal";
import GlobalModelDownloadWidget from "./components/GlobalModelDownloadWidget";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>(user?.avatar_url || "");
  const [, startTransition] = useTransition();

  useEffect(() => {
    const saved = localStorage.getItem("csa_dashboard_sidebar_collapsed");
    if (saved === "true") {
      startTransition(() => {
        setIsCollapsed(true);
      });
    }

    fetch("/api/channel/whatsapp").catch((err) =>
      console.error("Failed to check WhatsApp auto-connect status:", err)
    );
  }, []);

  useEffect(() => {
    if (user?.avatar_url && !avatarUrl) {
      startTransition(() => {
        setAvatarUrl(user.avatar_url || "");
      });
    }
  }, [user?.avatar_url, avatarUrl]);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("csa_dashboard_sidebar_collapsed", String(next));
      return next;
    });
  };

  useEffect(() => {
    if (loading) return;

    const storedToken = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (!storedToken || isTokenExpired(storedToken) || !user) {
      logout();
      router.replace("/login");
      return;
    }

    if (!user.is_active) {
      router.replace("/deactivated");
      return;
    }

    if (user.role !== "ADMIN") {
      router.replace("/chat");
      return;
    }
  }, [pathname, loading, user, logout, router]);

  if (loading) {
    return (
      <div
        suppressHydrationWarning
        style={{
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          background: "#faf9f8",
          color: "#605e5c",
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          fontWeight: "600",
        }}
      >
        Restoring session...
      </div>
    );
  }

  if (!user || !user.is_active || user.role !== "ADMIN") {
    return null;
  }

  return (
    <div
      suppressHydrationWarning
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "#faf9f8",
        color: "#323130",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        overflow: "hidden",
      }}
    >
      <DashboardHeader
        user={user}
        avatarUrl={avatarUrl}
        onOpenSettings={() => setShowSettingsModal(true)}
        onLogout={logout}
      />

      <div style={{ display: "flex", flexGrow: 1, overflow: "hidden" }}>
        <DashboardSidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleSidebar}
          userRole={user.role}
        />

        <main style={{ flexGrow: 1, overflowY: "auto", position: "relative" }}>
          {children}
        </main>
      </div>

      <ProfileSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        user={user}
        avatarUrl={avatarUrl}
        onAvatarChange={setAvatarUrl}
      />

      <GlobalModelDownloadWidget />
    </div>
  );
}
