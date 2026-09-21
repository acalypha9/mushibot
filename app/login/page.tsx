"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useAuth } from "../auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { X, CheckCircle2 } from "lucide-react";
import { isTokenExpired } from "@/lib/api";

const emptySubscribe = () => () => {};

export default function LoginPage() {
  const { login, loading, error, user, token } = useAuth();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // In-page Floating Forgot Password Modal State
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSubmitted, setResetSubmitted] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  useEffect(() => {
    if (mounted && !loading && user && token && !isTokenExpired(token)) {
      if (!user.is_active) {
        router.replace("/deactivated");
      } else {
        router.replace(user.role === "ADMIN" ? "/dashboard" : "/chat");
      }
    }
  }, [mounted, loading, user, token, router]);

  useEffect(() => {
    if (error) {
      setPassword("");
      passwordInputRef.current?.focus();
    }
  }, [error]);

  useEffect(() => {
    if (!isForgotPasswordOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsForgotPasswordOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isForgotPasswordOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      return;
    }
    try {
      const loggedUser = await login(email, password);
      if (!loggedUser.is_active) {
        router.push("/deactivated");
      } else {
        router.push(loggedUser.role === "ADMIN" ? "/dashboard" : "/chat");
      }
    } catch {
      setPassword("");
      passwordInputRef.current?.focus();
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setResetLoading(true);
    setResetError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setResetSubmitted(true);
    } catch {
      setResetError("Failed to send reset link. Please try again later.");
    } finally {
      setResetLoading(false);
    }
  };

  if (!mounted || loading || (user && token && !isTokenExpired(token))) {
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
          width: "100%",
          maxWidth: "27rem",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border)",
          background: "#ffffff",
          boxShadow: "var(--shadow-lg)",
          overflow: "hidden"
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
              MushiBot
            </h1>
          </div>

          <form
            onSubmit={handleSubmit}
            noValidate
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label
                htmlFor="login-email"
                style={{
                  fontSize: "11px",
                  color: "var(--muted-foreground)",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                }}
              >
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="ui-input"
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label
                htmlFor="login-password"
                style={{
                  fontSize: "11px",
                  color: "var(--muted-foreground)",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                }}
              >
                Password
              </label>
              <input
                ref={passwordInputRef}
                id="login-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="ui-input"
              />
            </div>

            {error && (
              <div
                role="alert"
                aria-live="polite"
                style={{
                  color: "var(--destructive)",
                  fontSize: "12px",
                  border: "1px solid #fecaca",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-sm)",
                  background: "#fef2f2",
                  marginTop: "4px",
                  lineHeight: "1.4"
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
                width: "100%",
                marginTop: "10px",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                letterSpacing: "0.03em"
              }}
            >
              {loading ? "Authenticating..." : "Sign In"}
            </button>
          </form>
        </section>

        <footer
          style={{
            borderTop: "1px solid var(--border)",
            padding: "16px 26px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "12.5px",
            color: "var(--muted-foreground)",
            background: "var(--background)"
          }}
        >
          <button
            type="button"
            onClick={() => {
              setIsForgotPasswordOpen(true);
              setResetSubmitted(false);
              setResetError(null);
            }}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: "12.5px",
              color: "var(--muted-foreground)",
              fontWeight: 500,
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#742774";
              e.currentTarget.style.textDecoration = "underline";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--muted-foreground)";
              e.currentTarget.style.textDecoration = "none";
            }}
          >
            Forgot password?
          </button>
          <Link
            href="/register"
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
            Register
          </Link>
        </footer>
      </div>

      {/* Floating In-Page Forgot Password Modal */}
      {isForgotPasswordOpen && (
        <>
          {/* Backdrop Overlay */}
          <div
            onClick={() => setIsForgotPasswordOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.45)",
              backdropFilter: "blur(2px)",
              zIndex: 100,
              cursor: "pointer",
            }}
          />

          {/* Floating Modal Centering Container */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 101,
              padding: "24px",
              pointerEvents: "none",
            }}
          >
            <div
              className="reveal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="forgot-password-title"
              style={{
                position: "relative",
                pointerEvents: "auto",
                width: "100%",
                maxWidth: "27rem",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--border)",
                background: "#ffffff",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                overflow: "hidden",
              }}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsForgotPasswordOpen(false)}
                aria-label="Close"
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  background: "transparent",
                  border: "none",
                  color: "var(--muted-foreground)",
                  cursor: "pointer",
                  padding: "6px",
                  borderRadius: "var(--radius-sm)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "color 0.15s ease, background-color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--foreground)";
                  e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--muted-foreground)";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <X size={18} />
              </button>

              <section style={{ padding: "32px 26px 28px" }}>
                <h1
                  id="forgot-password-title"
                  style={{
                    fontSize: "1.75rem",
                    fontFamily: "var(--font-display)",
                    fontWeight: 800,
                    marginBottom: "8px",
                    letterSpacing: "-0.02em",
                    color: "var(--foreground)",
                  }}
                >
                  Forgot Password
                </h1>
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--muted-foreground)",
                    marginBottom: "24px",
                    lineHeight: "1.5",
                  }}
                >
                  Enter your email address and we&apos;ll send you instructions to reset your password.
                </p>

                {resetSubmitted ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div
                      style={{
                        color: "#15803d",
                        border: "1px solid #bbf7d0",
                        padding: "16px",
                        background: "#f0fdf4",
                        fontSize: "13.5px",
                        borderRadius: "var(--radius-md)",
                        lineHeight: "1.5",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                        <CheckCircle2
                          style={{
                            width: "18px",
                            height: "18px",
                            color: "#16a34a",
                            flexShrink: 0,
                            marginTop: "2px",
                          }}
                        />
                        <span>
                          If an account exists for <strong>{resetEmail}</strong>, a password reset link has been sent. Please check your inbox.
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setResetSubmitted(false);
                        setResetEmail("");
                      }}
                      className="ui-btn ui-btn-outline ui-btn-md"
                      style={{ width: "100%", marginTop: "8px" }}
                    >
                      Reset another email
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleResetSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label
                        htmlFor="modal-reset-email"
                        style={{
                          fontSize: "11px",
                          color: "var(--muted-foreground)",
                          textTransform: "uppercase",
                          fontWeight: 700,
                          letterSpacing: "0.05em",
                        }}
                      >
                        Email Address
                      </label>
                      <input
                        id="modal-reset-email"
                        type="email"
                        required
                        autoComplete="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="you@domain.com"
                        className="ui-input"
                      />
                    </div>

                    {resetError && (
                      <div
                        role="alert"
                        aria-live="polite"
                        style={{
                          color: "var(--destructive)",
                          fontSize: "12px",
                          border: "1px solid #fecaca",
                          padding: "10px 14px",
                          borderRadius: "var(--radius-sm)",
                          background: "#fef2f2",
                          lineHeight: "1.4",
                        }}
                      >
                        {resetError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="ui-btn ui-btn-primary ui-btn-lg"
                      style={{
                        width: "100%",
                        marginTop: "8px",
                        fontFamily: "var(--font-display)",
                        fontWeight: 700,
                        letterSpacing: "0.03em",
                      }}
                    >
                      {resetLoading ? "Sending link..." : "Send Reset Link"}
                    </button>
                  </form>
                )}
              </section>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
