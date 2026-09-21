"use client";

import { useState, useEffect, useCallback } from "react";

export type BackendStatus = "checking" | "online" | "offline";

export function useBackendHealth(intervalMs = 8_000): BackendStatus {
  const [status, setStatus] = useState<BackendStatus>("offline"); // start offline until confirmed

  const check = useCallback(async () => {
    try {
      const res = await fetch("/health", {
        method: "GET",
        cache: "no-store",
        signal: AbortSignal.timeout(3000),
      });
      setStatus(res.ok ? "online" : "offline");
    } catch {
      setStatus("offline");
    }
  }, []);

  useEffect(() => {
    check(); // immediate first check
    const id = setInterval(check, intervalMs);
    return () => clearInterval(id);
  }, [check, intervalMs]);

  return status;
}
