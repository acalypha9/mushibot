"use client";

import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../../auth";
import {
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

export interface DownloadProgressInfo {
  model_id: string;
  status: "starting" | "downloading" | "completed" | "error" | "not_found";
  progress: number;
  downloaded_bytes: number;
  total_bytes: number;
  files_downloaded?: number;
  total_files?: number;
  speed?: string;
  message?: string;
  error?: string | null;
  is_downloaded?: boolean;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export default function GlobalModelDownloadWidget() {
  const { token } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [activeDownload, setActiveDownload] = useState<DownloadProgressInfo | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [dismissedModelId, setDismissedModelId] = useState<string | null>(null);

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const completionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchProgress = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/providers/download-progress", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data && Array.isArray(data.downloads)) {
        // Look for active download
        const running = data.downloads.find(
          (d: DownloadProgressInfo) => d.status === "downloading" || d.status === "starting"
        );

        if (running) {
          if (running.model_id !== dismissedModelId) {
            setActiveDownload(running);
          }
        } else if (activeDownload && (activeDownload.status === "downloading" || activeDownload.status === "starting")) {
          // Check if previous active download is now completed
          const finished = data.downloads.find(
            (d: DownloadProgressInfo) => d.model_id === activeDownload.model_id
          );
          if (finished) {
            setActiveDownload(finished);
            if (finished.status === "completed") {
              window.dispatchEvent(
                new CustomEvent("model-download-complete", {
                  detail: { model_id: finished.model_id }
                })
              );
            }
          }
        }
      }
    } catch {
      // transient network error
    }
  };

  // Poll loop: active = 600ms, idle = 3000ms
  useEffect(() => {
    if (!token) return;

    fetchProgress();

    const intervalMs = activeDownload && (activeDownload.status === "downloading" || activeDownload.status === "starting")
      ? 600
      : 3000;

    pollTimerRef.current = setInterval(fetchProgress, intervalMs);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [token, activeDownload?.status]);

  // Listen for local trigger event when a download starts in the UI
  useEffect(() => {
    const handleStarted = (e: Event) => {
      const customEvent = e as CustomEvent<{ model_id: string }>;
      setDismissedModelId(null);
      setIsMinimized(false);
      if (customEvent.detail?.model_id) {
        setActiveDownload({
          model_id: customEvent.detail.model_id,
          status: "starting",
          progress: 0,
          downloaded_bytes: 0,
          total_bytes: 0,
          message: "Starting download..."
        });
      }
      fetchProgress();
    };

    window.addEventListener("model-download-started", handleStarted);
    return () => {
      window.removeEventListener("model-download-started", handleStarted);
    };
  }, [token]);

  // Auto-dismiss completed widget after 5 seconds
  useEffect(() => {
    if (activeDownload?.status === "completed") {
      if (completionTimerRef.current) clearTimeout(completionTimerRef.current);
      completionTimerRef.current = setTimeout(() => {
        setActiveDownload(null);
      }, 5000);
    }
    return () => {
      if (completionTimerRef.current) clearTimeout(completionTimerRef.current);
    };
  }, [activeDownload?.status]);

  if (!activeDownload || activeDownload.model_id === dismissedModelId) {
    return null;
  }

  const isDownloading = activeDownload.status === "downloading" || activeDownload.status === "starting";
  const isCompleted = activeDownload.status === "completed";
  const isError = activeDownload.status === "error";

  const handleNavigateToProviders = () => {
    if (pathname !== "/dashboard/providers") {
      router.push("/dashboard/providers?tab=embedding");
    }
  };

  return (
    <aside
      aria-label="Model download progress"
      style={{
        position: "fixed",
        bottom: "20px",
        right: "24px",
        zIndex: 9999,
        maxWidth: "420px",
        width: isMinimized ? "auto" : "380px",
        background: "#ffffff",
        borderRadius: "12px",
        boxShadow: "0 12px 30px -4px rgba(0, 0, 0, 0.15), 0 4px 12px -2px rgba(0, 0, 0, 0.08)",
        border: isError
          ? "1px solid #fca5a5"
          : isCompleted
          ? "1px solid #86efac"
          : "1px solid #93c5fd",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        overflow: "hidden",
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
      }}
    >
      {/* MINIMIZED BAR */}
      {isMinimized ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 14px",
            cursor: "pointer",
            background: isCompleted ? "#f0fdf4" : isError ? "#fef2f2" : "#eff6ff"
          }}
          onClick={() => setIsMinimized(false)}
        >
          {isDownloading ? (
            <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite", color: "#2563eb" }} />
          ) : isCompleted ? (
            <CheckCircle2 style={{ width: "16px", height: "16px", color: "#16a34a" }} />
          ) : (
            <AlertCircle style={{ width: "16px", height: "16px", color: "#dc2626" }} />
          )}

          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#1e293b" }}>
              {activeDownload.model_id}
            </span>
            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>
              {isCompleted ? "Download Complete" : `${activeDownload.progress.toFixed(1)}% • ${activeDownload.speed || "Downloading"}`}
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(false);
            }}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              color: "#64748b"
            }}
          >
            <ChevronUp style={{ width: "15px", height: "15px" }} />
          </button>
        </div>
      ) : (
        /* EXPANDED FULL CARD */
        <div style={{ display: "flex", flexDirection: "column" }}>
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px",
              background: isCompleted ? "#f0fdf4" : isError ? "#fef2f2" : "#eff6ff",
              borderBottom: "1px solid rgba(0,0,0,0.06)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {isDownloading ? (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Loader2 style={{ width: "15px", height: "15px", animation: "spin 1s linear infinite", color: "#2563eb" }} />
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "#1e40af" }}>
                    Downloading Model
                  </span>
                </div>
              ) : isCompleted ? (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <CheckCircle2 style={{ width: "15px", height: "15px", color: "#16a34a" }} />
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "#15803d" }}>
                    Download Complete
                  </span>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <AlertCircle style={{ width: "15px", height: "15px", color: "#dc2626" }} />
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "#b91c1c" }}>
                    Download Failed
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                title="Minimize"
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                  borderRadius: "4px",
                  color: "#64748b",
                  display: "flex"
                }}
              >
                <ChevronDown style={{ width: "14px", height: "14px" }} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setDismissedModelId(activeDownload.model_id);
                  setActiveDownload(null);
                }}
                title="Dismiss"
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                  borderRadius: "4px",
                  color: "#64748b",
                  display: "flex"
                }}
              >
                <X style={{ width: "14px", height: "14px" }} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>
                  {activeDownload.model_id}
                </div>
                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                  Hugging Face Embedding Model
                </div>
              </div>

              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "800",
                  color: isCompleted ? "#16a34a" : isError ? "#dc2626" : "#2563eb",
                  fontVariantNumeric: "tabular-nums"
                }}
              >
                {activeDownload.progress.toFixed(1)}%
              </span>
            </div>

            {/* Metrics */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "11px",
                color: "#64748b"
              }}
            >
              <span>
                {activeDownload.downloaded_bytes > 0 && activeDownload.total_bytes > 0
                  ? `${formatBytes(activeDownload.downloaded_bytes)} / ${formatBytes(activeDownload.total_bytes)}`
                  : activeDownload.files_downloaded
                  ? `${activeDownload.files_downloaded} / ${activeDownload.total_files || "?"} files`
                  : activeDownload.message || "Downloading..."}
              </span>

              {activeDownload.speed ? (
                <span
                  style={{
                    fontWeight: "600",
                    color: "#1e40af",
                    background: "#eff6ff",
                    padding: "1px 6px",
                    borderRadius: "6px"
                  }}
                >
                  {activeDownload.speed}
                </span>
              ) : null}
            </div>

            {/* Progress Track */}
            <div
              style={{
                width: "100%",
                height: "8px",
                borderRadius: "999px",
                background: "#e2e8f0",
                overflow: "hidden"
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${Math.max(2, Math.min(100, activeDownload.progress))}%`,
                  background: isCompleted
                    ? "linear-gradient(90deg, #22c55e 0%, #16a34a 100%)"
                    : isError
                    ? "#ef4444"
                    : "linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)",
                  borderRadius: "999px",
                  transition: "width 0.3s ease-out"
                }}
              />
            </div>

            {/* Error detail if any */}
            {isError && activeDownload.error && (
              <div
                style={{
                  fontSize: "11px",
                  color: "#b91c1c",
                  background: "#fef2f2",
                  padding: "6px 10px",
                  borderRadius: "6px",
                  border: "1px solid #fecaca"
                }}
              >
                {activeDownload.error}
              </div>
            )}

            {/* Footer / Quick link */}
            {pathname !== "/dashboard/providers" && (
              <button
                type="button"
                onClick={handleNavigateToProviders}
                style={{
                  marginTop: "2px",
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "#2563eb",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: 0,
                  alignSelf: "flex-start"
                }}
              >
                <span>View in Providers tab</span>
                <ExternalLink style={{ width: "11px", height: "11px" }} />
              </button>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
