"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { useAuth } from "../../auth";
import { SortColumn, SortDirection, ViewMode } from "./types";
import { filterAndSortConversations, paginateConversations } from "./helpers";
import { useConversationsData, useConversationMessages } from "./useConversationData";
import { useConversationActions } from "./useConversationActions";
import { ConversationsToolbar } from "./ConversationsToolbar";
import { ConversationsTableView } from "./ConversationsTableView";
import { MessageLogDrawer } from "./MessageLogDrawer";
import { SplitConversationView } from "./SplitConversationView";
import { DeleteConversationModal } from "./DeleteConversationModal";

export default function ConversationsPage() {
  const { token, user } = useAuth();

  const {
    conversations,
    loading,
    errorMsg,
    fetchConversations,
    setConversations,
    setActionError
  } = useConversationsData(token);

  // Search & Filter State
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  // Selected session for Message Log view
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [showLogDrawer, setShowLogDrawer] = useState(false);

  const { messages, msgLoading, msgError } = useConversationMessages(token, selectedConvId);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Sorting state for table
  const [sortColumn, setSortColumn] = useState<SortColumn>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const {
    editingConvId,
    editingTitle,
    setEditingConvId,
    setEditingTitle,
    deleteModal,
    setDeleteModal,
    handleDeleteConversation,
    handleBulkDelete,
    handleSaveTitle
  } = useConversationActions({
    token,
    setConversations,
    setActionError,
    selectedConvId,
    setSelectedConvId,
    setShowLogDrawer,
    selectedIds,
    setSelectedIds,
    fetchConversations
  });

  const handleSort = (column: SortColumn) => {
    setSortDirection((prev) => (sortColumn === column && prev === "asc" ? "desc" : "asc"));
    setSortColumn(column);
  };

  useEffect(() => {
    if (conversations.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedConvId((prev) => prev || conversations[0].id);
    }
  }, [conversations]);

  // ESC Key Listener to Close Message Log Drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowLogDrawer(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!user || (user.role !== "ADMIN" && user.role !== "CS_AGENT")) {
    return (
      <div style={{ padding: "32px", fontFamily: "var(--font-body)", color: "#a4262c", fontWeight: "bold" }}>
        UNAUTHORIZED ACCESS.
      </div>
    );
  }

  const filteredConversations = filterAndSortConversations(
    conversations,
    searchTerm,
    platformFilter,
    typeFilter,
    sortColumn,
    sortDirection
  );

  const { paginated, totalItems, totalPages, startIndex } = paginateConversations(
    filteredConversations,
    currentPage,
    itemsPerPage
  );

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedIds(e.target.checked ? filteredConversations.map((c) => c.id) : []);
  };

  const handleSelectOne = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setSelectedIds((prev) => (e.target.checked ? [...prev, id] : prev.filter((item) => item !== id)));
  };

  return (
    <div
      style={{
        minHeight: "100%",
        backgroundColor: "#faf9f8",
        padding: "28px 40px 60px 40px",
        boxSizing: "border-box",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: "#323130"
      }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
        <ConversationsToolbar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          filteredCount={filteredConversations.length}
          platformFilter={platformFilter}
          onPlatformFilterChange={setPlatformFilter}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          onSearchSubmit={setSearchTerm}
          onClearSearch={() => {
            setSearchInput("");
            setSearchTerm("");
          }}
          onRefresh={fetchConversations}
          loading={loading}
        />

        {errorMsg && (
          <div
            style={{
              border: "1px solid #fca5a5",
              background: "#fef2f2",
              color: "#dc2626",
              padding: "12px 16px",
              borderRadius: "10px",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <AlertCircle style={{ width: "16px", height: "16px" }} /> {errorMsg}
          </div>
        )}

        {viewMode === "table" && (
          <ConversationsTableView
            paginated={paginated}
            filteredCount={filteredConversations.length}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onSelectOne={handleSelectOne}
            onBulkDelete={handleBulkDelete}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={handleSort}
            editingConvId={editingConvId}
            editingTitle={editingTitle}
            setEditingConvId={setEditingConvId}
            setEditingTitle={setEditingTitle}
            onSaveTitle={handleSaveTitle}
            setSelectedConvId={setSelectedConvId}
            setShowLogDrawer={setShowLogDrawer}
            onDeleteConversation={handleDeleteConversation}
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
            startIndex={startIndex}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(size) => {
              setItemsPerPage(size);
              setCurrentPage(1);
            }}
          />
        )}

        {viewMode === "table" && (
          <MessageLogDrawer
            isOpen={showLogDrawer}
            selectedConvId={selectedConvId}
            messages={messages}
            loading={msgLoading}
            error={msgError}
            onClose={() => setShowLogDrawer(false)}
          />
        )}

        {viewMode === "split" && (
          <SplitConversationView
            conversations={conversations}
            filteredCount={filteredConversations.length}
            selectedConvId={selectedConvId}
            onSelectConversation={setSelectedConvId}
            messages={messages}
            msgLoading={msgLoading}
            msgError={msgError}
          />
        )}

        <DeleteConversationModal
          deleteModal={deleteModal}
          onClose={() => setDeleteModal((prev) => ({ ...prev, show: false }))}
        />
      </div>
    </div>
  );
}
