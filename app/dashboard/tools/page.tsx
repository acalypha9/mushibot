"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "../../auth";
import type { McpServerItem } from "./types";

// Modals
import ViewMcpToolsModal from "./components/ViewMcpToolsModal";
import AddMcpServerModal from "./components/AddMcpServerModal";
import ReminderFormModal from "./components/ReminderFormModal";
import DeleteReminderModal from "./components/DeleteReminderModal";
import TestReminderResultModal from "./components/TestReminderResultModal";

// Tabs & Navigation
import ToolsFeedbackBanners from "./components/ToolsFeedbackBanners";
import ToolsNavigationTabs from "./components/ToolsNavigationTabs";
import FunctionToolsTab from "./components/FunctionToolsTab";
import McpTab from "./components/McpTab";
import RemindersTab from "./components/RemindersTab";

// Custom State Hooks
import { useFunctionToolsState } from "./hooks/useFunctionToolsState";
import { useMcpServersState } from "./hooks/useMcpServersState";
import { useRemindersState } from "./hooks/useRemindersState";

export default function FunctionToolsPage() {
  const { token } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const showError = useCallback((msg: string) => {
    setErrorMsg(msg);
    setSuccessMsg(null);
  }, []);

  const showSuccess = useCallback((msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg(null);
  }, []);

  useEffect(() => {
    if (errorMsg || successMsg) {
      const timer = setTimeout(() => {
        setErrorMsg(null);
        setSuccessMsg(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg, successMsg]);

  const [mainTab, setMainTab] = useState<"function_tools" | "mcp" | "reminders">(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "cron_reminders" || tabParam === "reminders") {
        return "reminders";
      }
    }
    return "function_tools";
  });

  const toolOptions = useMemo(
    () => ({ onError: showError, onSuccess: showSuccess }),
    [showError, showSuccess]
  );

  const funcTools = useFunctionToolsState(token, toolOptions);
  const mcp = useMcpServersState(token, toolOptions);
  const rem = useRemindersState(token, toolOptions);

  // Initial loads
  const { fetchTools } = funcTools;
  const { fetchMcpServers } = mcp;
  const { fetchReminders, fetchChannels } = rem;

  useEffect(() => {
    if (token) {
      fetchTools(false);
      fetchMcpServers();
      fetchReminders();
      fetchChannels();
    }
  }, [token, fetchTools, fetchMcpServers, fetchReminders, fetchChannels]);

  return (
    <div
      style={{
        minHeight: "100%",
        backgroundColor: "#faf9f8",
        padding: "28px 40px 60px 40px",
        boxSizing: "border-box",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: "#323130",
      }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
        <header>
          <h1
            style={{
              fontSize: "20px",
              fontWeight: "700",
              color: "#323130",
              marginTop: "4px",
              letterSpacing: "-0.01em",
            }}
          >
            Tools
          </h1>
          <p style={{ fontSize: "13px", color: "#605e5c", marginTop: "4px" }}>
            Manage active AI agent function tools, parameter schemas, knowledge functions, and MCP server integrations.
          </p>
        </header>

        <ToolsFeedbackBanners errorMsg={errorMsg} successMsg={successMsg} />

        <ToolsNavigationTabs mainTab={mainTab} setMainTab={setMainTab} />

        {/* TAB 1: FUNCTION TOOLS */}
        {mainTab === "function_tools" && (
          <FunctionToolsTab
            tools={funcTools.tools}
            topLevelTools={funcTools.topLevelTools}
            paginatedTopLevelTools={funcTools.paginatedTopLevelTools}
            loading={funcTools.loadingTools}
            statusFilter={funcTools.statusFilter}
            setStatusFilter={funcTools.setStatusFilter}
            searchInput={funcTools.searchInput}
            setSearchInput={funcTools.setSearchInput}
            setSearchQuery={funcTools.setSearchQuery}
            currentPage={funcTools.currentPage}
            setCurrentPage={funcTools.setCurrentPage}
            itemsPerPage={funcTools.itemsPerPage}
            setItemsPerPage={funcTools.setItemsPerPage}
            totalItems={funcTools.totalItems}
            totalPages={funcTools.totalPages}
            startIndex={funcTools.startIndex}
            sortColumn={funcTools.sortColumn}
            sortDirection={funcTools.sortDirection}
            handleSort={funcTools.handleSortTools}
            fetchTools={funcTools.fetchTools}
            handleToggle={funcTools.handleToggleTool}
            expandedRowId={funcTools.expandedRowId}
            setExpandedRowId={funcTools.setExpandedRowId}
            openDependentToolsIds={funcTools.openDependentToolsIds}
            setOpenDependentToolsIds={funcTools.setOpenDependentToolsIds}
            DEPENDENT_TOOL_MAP={funcTools.DEPENDENT_TOOL_MAP}
          />
        )}

        {/* TAB 2: MCP */}
        {mainTab === "mcp" && (
          <McpTab
            mcpServers={mcp.mcpServers}
            onOpenAddModal={() => mcp.setShowAddMcpModal(true)}
            onOpenToolsModal={(srv: McpServerItem) =>
              mcp.setViewMcpToolsModal({ show: true, serverName: srv.name, tools: srv.tools || [] })
            }
            onToggleServer={(serverId: string) => {
              const target = mcp.mcpServers.find((s) => s.id === serverId);
              if (target) mcp.handleToggleMcpServer(target);
            }}
            onDeleteServer={(serverId: string) => {
              const target = mcp.mcpServers.find((s) => s.id === serverId);
              if (target) mcp.handleDeleteMcpServer(target);
            }}
          />
        )}

        {/* TAB 3: REMINDERS */}
        {mainTab === "reminders" && (
          <RemindersTab
            reminders={rem.reminders}
            availableChannels={rem.availableChannels}
            loadingReminders={rem.loadingReminders}
            reminderChannelFilter={rem.reminderChannelFilter}
            setReminderChannelFilter={rem.setReminderChannelFilter}
            reminderStatusFilter={rem.reminderStatusFilter}
            setReminderStatusFilter={rem.setReminderStatusFilter}
            reminderSearchInput={rem.reminderSearchInput}
            setReminderSearchInput={rem.setReminderSearchInput}
            reminderSearchTerm={rem.reminderSearchTerm}
            setReminderSearchTerm={rem.setReminderSearchTerm}
            reminderSortColumn={rem.reminderSortColumn}
            setReminderSortColumn={rem.setReminderSortColumn}
            reminderSortDirection={rem.reminderSortDirection}
            setReminderSortDirection={rem.setReminderSortDirection}
            reminderCurrentPage={rem.reminderCurrentPage}
            setReminderCurrentPage={rem.setReminderCurrentPage}
            reminderItemsPerPage={rem.reminderItemsPerPage}
            setReminderItemsPerPage={rem.setReminderItemsPerPage}
            selectedReminderIds={rem.selectedReminderIds}
            setSelectedReminderIds={rem.setSelectedReminderIds}
            onBulkDelete={() => rem.setShowBulkDeleteModal(true)}
            triggeringReminderId={rem.triggeringReminderId}
            fetchReminders={rem.fetchReminders}
            onOpenAddModal={() => {
              rem.fetchChannels();
              rem.setEditingReminder(null);
              rem.setShowReminderModal(true);
            }}
            onOpenEditModal={(r) => {
              rem.fetchChannels();
              rem.setEditingReminder(r);
              rem.setShowReminderModal(true);
            }}
            onToggleStatus={rem.handleToggleReminderStatus}
            onTriggerNow={rem.handleTriggerReminderNow}
            onDeleteTarget={(r) => rem.setDeleteTargetReminder(r)}
          />
        )}

        {/* MODALS */}
        <ViewMcpToolsModal
          isOpen={mcp.viewMcpToolsModal.show}
          onClose={() => mcp.setViewMcpToolsModal({ show: false, serverName: "", tools: [] })}
          serverName={mcp.viewMcpToolsModal.serverName}
          tools={mcp.viewMcpToolsModal.tools}
        />

        <AddMcpServerModal
          isOpen={mcp.showAddMcpModal}
          onClose={() => mcp.setShowAddMcpModal(false)}
          token={token}
          onServerAdded={() => {
            showSuccess("MCP server configured successfully.");
            mcp.fetchMcpServers();
          }}
          setSuccessMsg={setSuccessMsg}
        />

        <ReminderFormModal
          isOpen={rem.showReminderModal}
          onClose={() => {
            rem.setShowReminderModal(false);
            rem.setEditingReminder(null);
          }}
          editingReminder={rem.editingReminder}
          availableChannels={rem.availableChannels}
          token={token}
          onSaved={(title, isEdit) => {
            showSuccess(`Reminder "${title}" ${isEdit ? "updated" : "created"} successfully.`);
            rem.fetchReminders(true);
          }}
        />

        <DeleteReminderModal
          isOpen={Boolean(rem.deleteTargetReminder) || rem.showBulkDeleteModal}
          onClose={() => {
            rem.setDeleteTargetReminder(null);
            rem.setShowBulkDeleteModal(false);
          }}
          targetReminder={rem.deleteTargetReminder}
          selectedCount={rem.showBulkDeleteModal ? rem.selectedReminderIds.length : undefined}
          deleting={rem.deletingReminder}
          onConfirmDelete={() => {
            if (rem.showBulkDeleteModal) {
              rem.handleBulkDeleteReminders();
            } else {
              rem.handleDeleteReminder();
            }
          }}
        />

        <TestReminderResultModal
          isOpen={rem.showTestResultModal}
          onClose={() => {
            rem.setShowTestResultModal(false);
            rem.setTestResult(null);
          }}
          result={rem.testResult}
          reminderTitle={rem.testReminderTargetTitle}
        />
      </div>
    </div>
  );
}
