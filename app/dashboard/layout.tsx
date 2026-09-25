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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

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

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
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
      className="dashboard-layout-root"
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
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={toggleMobileMenu}
      />

      <div
        className={`dashboard-sidebar-backdrop ${isMobileMenuOpen ? "active" : ""}`}
        onClick={closeMobileMenu}
        aria-hidden="true"
      />

      <div className="dashboard-body" style={{ display: "flex", flexGrow: 1, minWidth: 0, minHeight: 0, overflow: "hidden", position: "relative" }}>
        <DashboardSidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleSidebar}
          userRole={user.role}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={closeMobileMenu}
        />

        <main
          className="dashboard-main-content"
          style={{ flexGrow: 1, minWidth: 0, overflowY: "auto", position: "relative" }}
        >
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
