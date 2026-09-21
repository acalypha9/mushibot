"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { FunctionToolItem } from "../types";

interface UseFunctionToolsStateOptions {
  onError?: (msg: string) => void;
  onSuccess?: (msg: string) => void;
}

export function useFunctionToolsState(
  token: string | null,
  options?: UseFunctionToolsStateOptions
) {
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const [tools, setTools] = useState<FunctionToolItem[]>([]);
  const [loadingTools, setLoadingTools] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortColumn, setSortColumn] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [openDependentToolsIds, setOpenDependentToolsIds] = useState<Record<string, boolean>>({});

  const DEPENDENT_TOOL_MAP: Record<string, string> = useMemo(() => ({}), []);

  const fetchTools = useCallback(
    async (silent = false) => {
      if (!token) return;
      if (!silent) setLoadingTools(true);
      try {
        const res = await fetch("/api/tools", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || data.error || "Failed to fetch function tools");
        setTools(Array.isArray(data) ? data : []);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error loading function tools";
        console.error(msg, err);
        if (!silent) optionsRef.current?.onError?.(msg);
      } finally {
        if (!silent) setLoadingTools(false);
      }
    },
    [token]
  );

  const handleToggleTool = useCallback(
    async (tool: FunctionToolItem, e?: React.MouseEvent | React.ChangeEvent) => {
      if (e) e.stopPropagation();
      if (!token) return;

      const newStatus = !tool.is_enabled;
      setTools((prev) =>
        prev.map((t) => {
          if (t.id === tool.id) return { ...t, is_enabled: newStatus };
          return t;
        })
      );

      try {
        const res = await fetch(`/api/tools/${tool.id}/toggle`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed to toggle tool");
        optionsRef.current?.onSuccess?.(`Tool "${tool.display_name || tool.name}" ${newStatus ? "enabled" : "disabled"}.`);
        fetchTools(true);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to toggle tool";
        console.error(msg, err);
        optionsRef.current?.onError?.(msg);
        fetchTools(true);
      }
    },
    [token, fetchTools]
  );

  const handleSortTools = useCallback((column: string) => {
    setSortColumn((prevCol) => {
      if (prevCol === column) {
        setSortDirection((prevDir) => (prevDir === "asc" ? "desc" : "asc"));
        return prevCol;
      }
      setSortDirection("asc");
      return column;
    });
  }, []);

  const filteredTools = useMemo(() => {
    const result = tools.filter((t) => {
      if (statusFilter === "enabled" && !t.is_enabled) return false;
      if (statusFilter === "disabled" && t.is_enabled) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = (t.name || "").toLowerCase().includes(q);
        const displayMatch = (t.display_name || "").toLowerCase().includes(q);
        const descMatch = (t.description || "").toLowerCase().includes(q);
        const categoryMatch = (t.category || "").toLowerCase().includes(q);
        const paramsMatch = (t.parameters_json || "").toLowerCase().includes(q);

        const hasMatchingChild = tools.some(
          (child) =>
            DEPENDENT_TOOL_MAP[child.name] === t.name &&
            ((child.name || "").toLowerCase().includes(q) ||
              (child.display_name || "").toLowerCase().includes(q) ||
              (child.description || "").toLowerCase().includes(q) ||
              (child.parameters_json || "").toLowerCase().includes(q))
        );

        if (!nameMatch && !displayMatch && !descMatch && !categoryMatch && !paramsMatch && !hasMatchingChild) {
          return false;
        }
      }

      return true;
    });

    result.sort((a, b) => {
      const rawA = a[sortColumn as keyof FunctionToolItem];
      const rawB = b[sortColumn as keyof FunctionToolItem];

      let valA: string | number = "";
      let valB: string | number = "";

      if (typeof rawA === "boolean") valA = rawA ? 1 : 0;
      else if (typeof rawA === "number") valA = rawA;
      else if (typeof rawA === "string") valA = rawA.toLowerCase();

      if (typeof rawB === "boolean") valB = rawB ? 1 : 0;
      else if (typeof rawB === "number") valB = rawB;
      else if (typeof rawB === "string") valB = rawB.toLowerCase();

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [tools, statusFilter, searchQuery, sortColumn, sortDirection, DEPENDENT_TOOL_MAP]);

  const topLevelTools = useMemo(() => {
    return filteredTools.filter((t) => !DEPENDENT_TOOL_MAP[t.name]);
  }, [filteredTools, DEPENDENT_TOOL_MAP]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      tools.forEach((t) => {
        const parentName = DEPENDENT_TOOL_MAP[t.name];
        if (parentName) {
          const parentTool = tools.find((p) => p.name === parentName);
          if (
            parentTool &&
            ((t.name || "").toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q))
          ) {
            setExpandedRowId((prev) => (prev === parentTool.id ? prev : parentTool.id));
            setOpenDependentToolsIds((prev) => (prev[parentTool.id] ? prev : { ...prev, [parentTool.id]: true }));
          }
        }
      });
    }
  }, [searchQuery, tools, DEPENDENT_TOOL_MAP]);

  const totalItems = topLevelTools.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTopLevelTools = useMemo(() => {
    return topLevelTools.slice(startIndex, startIndex + itemsPerPage);
  }, [topLevelTools, startIndex, itemsPerPage]);

  return {
    tools,
    loadingTools,
    searchInput,
    setSearchInput,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortColumn,
    sortDirection,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    expandedRowId,
    setExpandedRowId,
    openDependentToolsIds,
    setOpenDependentToolsIds,
    DEPENDENT_TOOL_MAP,
    fetchTools,
    handleToggleTool,
    handleSortTools,
    topLevelTools,
    paginatedTopLevelTools,
    totalItems,
    totalPages,
    startIndex,
  };
}
