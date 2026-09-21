"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface UseApiCallOptions<T> {
  /** Whether to fetch immediately on mount. Default: true */
  immediate?: boolean;
  /** Initial data value */
  initialData?: T;
  /** Transform the JSON response before setting state */
  transform?: (json: any) => T;
}

export interface UseApiCallReturn<T> {
  data: T;
  loading: boolean;
  error: string | null;
  /** Manually trigger a fetch/refetch */
  refetch: () => Promise<void>;
  /** Manually set data (for optimistic updates) */
  setData: React.Dispatch<React.SetStateAction<T>>;
}

export function useApiCall<T>(
  url: string | null,
  token: string | null,
  options?: UseApiCallOptions<T>
): UseApiCallReturn<T> {
  const { immediate = true, initialData, transform } = options || {};

  const [data, setData] = useState<T>(initialData as T);
  const [loading, setLoading] = useState<boolean>(Boolean(immediate && url && token));
  const [error, setError] = useState<string | null>(null);

  // Store transform function in a ref to avoid re-triggering effects when inline transform functions are passed
  const transformRef = useRef(transform);
  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);

  const activeAbortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (!url || !token) {
      setLoading(false);
      return;
    }

    // Cancel any ongoing fetch for this hook instance
    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    activeAbortControllerRef.current = abortController;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        signal: abortController.signal
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        let message = "Request failed";
        if (typeof json?.detail === "string") {
          message = json.detail;
        } else if (Array.isArray(json?.detail)) {
          message = json.detail.map((d: { msg?: string }) => d.msg || "Invalid input").join(", ");
        } else if (json?.error?.message) {
          message = json.error.message;
        } else if (json?.message) {
          message = json.message;
        } else if (res.statusText) {
          message = res.statusText;
        }
        throw new Error(message);
      }

      const finalData: T = transformRef.current ? transformRef.current(json) : (json as T);
      setData(finalData);
    } catch (err: any) {
      if (err?.name === "AbortError") {
        // Fetch was aborted, ignore
        return;
      }
      setError(err instanceof Error ? err.message : (err?.message || "An unexpected error occurred"));
    } finally {
      if (activeAbortControllerRef.current === abortController) {
        setLoading(false);
      }
    }
  }, [url, token]);

  useEffect(() => {
    if (immediate && url && token) {
      fetchData();
    } else if (!url || !token) {
      setLoading(false);
    }

    return () => {
      if (activeAbortControllerRef.current) {
        activeAbortControllerRef.current.abort();
      }
    };
  }, [url, token, immediate, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    setData
  };
}
