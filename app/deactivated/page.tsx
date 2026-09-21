"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ShieldAlert, LogOut } from "lucide-react";
import { useAuth } from "../auth";
import { isTokenExpired } from "@/lib/api";

const emptySubscribe = () => () => {};

export default function DeactivatedPage() {
  const { user, token, loading, logout } = useAuth();
  const router = useRouter();

  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  useEffect(() => {
    if (!mounted || loading) return;

    if (!token || !user || isTokenExpired(token)) {
      router.replace("/login");
      return;
    }

    if (user.is_active) {
      router.replace(user.role === "ADMIN" ? "/dashboard" : "/chat");
    }
  }, [mounted, loading, user, token, router]);

  if (!mounted || loading || !user || user.is_active) {
    return null;
  }

  return (
    <main
      className="status-page"
      suppressHydrationWarning
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fbfafc",
        padding: "24px",
        position: "relative",
      }}
    >
      <div
        className="reveal"
        suppressHydrationWarning
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          width: "100%",
          maxWidth: "27rem",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border)",
          background: "#ffffff",
          boxShadow: "var(--shadow-lg)",
          padding: "36px 28px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <Image
            src="/mushibot-logo.png"
            alt="MushiBot Logo"
            width={48}
            height={48}
            priority
            style={{ objectFit: "contain" }}
          />
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "#fef2f3",
              border: "1px solid #fad5d8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#e15a64",
            }}
          >
            <ShieldAlert size={24} />
          </div>
        </div>

        <h1
          style={{
            fontSize: "1.5rem",
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            marginBottom: "10px",
            letterSpacing: "-0.02em",
            color: "var(--foreground)",
          }}
        >
          Account Deactivated
        </h1>

        <p
          style={{
            fontSize: "14px",
            color: "var(--muted-foreground)",
            lineHeight: 1.6,
            marginBottom: "16px",
          }}
        >
          Your account has been deactivated. You currently do not have access to this service. If you believe this is an error, please contact your administrator.
        </p>

        {user.email && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: "var(--muted)",
              border: "1px solid var(--border)",
              padding: "4px 12px",
              borderRadius: "9999px",
              fontSize: "12px",
              color: "var(--muted-foreground)",
              fontWeight: 500,
              marginBottom: "28px",
              wordBreak: "break-all",
            }}
          >
            {user.email}
          </div>
        )}

        <button
          type="button"
          onClick={logout}
          className="ui-btn ui-btn-outline ui-btn-lg"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            cursor: "pointer",
          }}
        >
          <LogOut size={16} />
          Log Out
        </button>
      </div>
    </main>
  );
}
