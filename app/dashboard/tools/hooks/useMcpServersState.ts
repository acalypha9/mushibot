"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { McpServerItem, McpToolItem } from "../types";
import {
  getMcpServersEndpoint,
  getMcpServerToggleEndpoint,
  getMcpServerDeleteEndpoint,
} from "../api_contracts";

interface UseMcpServersStateOptions {
  onError?: (msg: string) => void;
  onSuccess?: (msg: string) => void;
}

export function useMcpServersState(
  token: string | null,
  options?: UseMcpServersStateOptions
) {
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const [mcpServers, setMcpServers] = useState<McpServerItem[]>([]);
  const [showAddMcpModal, setShowAddMcpModal] = useState(false);
  const [viewMcpToolsModal, setViewMcpToolsModal] = useState<{
    show: boolean;
    serverName: string;
    tools: (string | McpToolItem)[];
  }>({ show: false, serverName: "", tools: [] });

  const fetchMcpServers = useCallback(async () => {
    if (!token) return;
    try {
      const ep = getMcpServersEndpoint();
      const res = await fetch(ep.url, {
        method: ep.method,
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || "Failed to fetch MCP servers");
      setMcpServers(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error loading MCP servers";
      console.error(msg, err);
      optionsRef.current?.onError?.(msg);
    }
  }, [token]);

  const handleToggleMcpServer = useCallback(
    async (srv: McpServerItem, e?: React.MouseEvent | React.ChangeEvent) => {
      if (e) e.stopPropagation();
      if (!token) return;

      const newStatus = !srv.is_enabled;
      setMcpServers((prev) =>
        prev.map((s) => {
          if (s.id === srv.id) return { ...s, is_enabled: newStatus };
          return s;
        })
      );

      try {
        const ep = getMcpServerToggleEndpoint(srv.id);
        const res = await fetch(ep.url, {
          method: ep.method,
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed to toggle MCP server");
        optionsRef.current?.onSuccess?.(`MCP server "${srv.name}" ${newStatus ? "enabled" : "disabled"}.`);
        fetchMcpServers();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to toggle MCP server";
        console.error(msg, err);
        optionsRef.current?.onError?.(msg);
        fetchMcpServers();
      }
    },
    [token, fetchMcpServers]
  );

  const handleDeleteMcpServer = useCallback(
    async (srv: McpServerItem, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      if (!confirm(`Are you sure you want to delete MCP Server "${srv.name}"?`)) return;
      if (!token) return;

      try {
        const ep = getMcpServerDeleteEndpoint(srv.id);
        const res = await fetch(ep.url, {
          method: ep.method,
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.detail || "Failed to delete MCP server");
        optionsRef.current?.onSuccess?.(`MCP server "${srv.name}" deleted successfully.`);
        fetchMcpServers();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to delete MCP server";
        console.error(msg, err);
        optionsRef.current?.onError?.(msg);
      }
    },
    [token, fetchMcpServers]
  );

  return {
    mcpServers,
    showAddMcpModal,
    setShowAddMcpModal,
    viewMcpToolsModal,
    setViewMcpToolsModal,
    fetchMcpServers,
    handleToggleMcpServer,
    handleDeleteMcpServer,
  };
}
