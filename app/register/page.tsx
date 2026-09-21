"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";

const labelStyle: React.CSSProperties = {
  fontSize: "11px",
  color: "var(--muted-foreground)",
  textTransform: "uppercase",
  fontWeight: 700,
  letterSpacing: "0.05em",
};

export default function RegisterPage() {
  const { register, loading, error, user, token } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!loading && (user || token)) {
      if (user && !user.is_active) {
        router.replace("/deactivated");
      } else if (user?.role === "ADMIN") {
        router.replace("/dashboard");
      } else {
        router.replace("/chat");
      }
    }
  }, [loading, user, token, router]);

  useEffect(() => {
    if (error) {
      setPassword("");
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      return;
    }
    try {
      await register(email, password, fullName);
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch {
      setPassword("");
    }
  };

  if (loading || user || token) {
    return null;
  }

  return (
    <main
      className="status-page"
      style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#fbfafc",
        padding: "24px",
      }}
    >
      <div
        className="reveal"
        style={{
          display: "flex", flexDirection: "column", width: "100%", maxWidth: "27rem",
          borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", background: "#ffffff",
          boxShadow: "var(--shadow-lg)", overflow: "hidden",
        }}
      >
        <section style={{ padding: "32px 26px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <Image
              src="/mushibot-logo.png"
              alt="MushiBot Logo"
              width={40}
              height={40}
              priority
              style={{ objectFit: "contain" }}
            />
            <h1
              style={{
                fontSize: "1.75rem",
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: "var(--foreground)",
                margin: 0
              }}
            >
              Create Account
            </h1>
          </div>

          {success ? (
            <div
              style={{
                color: "#742774",
                border: "1px solid #b33770",
                padding: "14px 16px",
                background: "#fdf2f7",
                fontSize: "13.5px",
                borderRadius: "var(--radius-md)",
                marginBottom: "16px",
                lineHeight: "1.5",
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontWeight: 600 }}>
                <CheckCircle2 style={{ width: "18px", height: "18px", color: "#b33770" }} /> Account created successfully! Redirecting you to login page...
              </span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label htmlFor="fullName" style={labelStyle}>Full Name</label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Red Ketchum"
                  className="ui-input"
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label htmlFor="email" style={labelStyle}>Email Address</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="red@pallettown.com"
                  className="ui-input"
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label htmlFor="password" style={labelStyle}>Password</label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="ui-input"
                />
              </div>

              {error && (
                <div
                  style={{
                    color: "var(--destructive)", fontSize: "12px", border: "1px solid #fecaca",
                    padding: "10px 14px", borderRadius: "var(--radius-sm)", background: "#fef2f2",
                    marginTop: "4px", lineHeight: "1.4",
                  }}
                >
                  <strong>Error:</strong> {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="ui-btn ui-btn-primary ui-btn-lg"
                style={{
                  width: "100%", marginTop: "10px", fontFamily: "var(--font-display)",
                  fontWeight: 700, letterSpacing: "0.03em",
                }}
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>
          )}
        </section>

        <footer
          style={{
            borderTop: "1px solid var(--border)", padding: "16px 26px", display: "flex",
            justifyContent: "space-between", alignItems: "center", fontSize: "12.5px",
            color: "var(--muted-foreground)", background: "var(--background)",
          }}
        >
          <span>Already have an account?</span>
          <Link
            href="/login"
            style={{
              color: "#742774",
              textDecoration: "none",
              fontWeight: 700,
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#a739a7";
              e.currentTarget.style.textDecoration = "underline";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#742774";
              e.currentTarget.style.textDecoration = "none";
            }}
          >
            Login
          </Link>
        </footer>
      </div>
    </main>
  );
}
