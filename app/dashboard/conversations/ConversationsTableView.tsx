"use client";

import React from "react";
import { ConversationTable } from "./ConversationTable";
import { ConversationsPagination } from "./ConversationsPagination";
import { Conversation, SortColumn, SortDirection } from "./types";

interface ConversationsTableViewProps {
  paginated: Conversation[];
  filteredCount: number;
  selectedIds: string[];
  onSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectOne: (id: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  onBulkDelete: () => void;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  onSort: (column: SortColumn) => void;
  editingConvId: string | null;
  editingTitle: string;
  setEditingConvId: (id: string | null) => void;
  setEditingTitle: (title: string) => void;
  onSaveTitle: (id: string) => void;
  setSelectedConvId: (id: string) => void;
  setShowLogDrawer: (show: boolean) => void;
  onDeleteConversation: (id: string, e: React.MouseEvent) => void;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  startIndex: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (size: number) => void;
}

export function ConversationsTableView({
  paginated,
  filteredCount,
  selectedIds,
  onSelectAll,
  onSelectOne,
  onBulkDelete,
  sortColumn,
  sortDirection,
  onSort,
  editingConvId,
  editingTitle,
  setEditingConvId,
  setEditingTitle,
  onSaveTitle,
  setSelectedConvId,
  setShowLogDrawer,
  onDeleteConversation,
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  startIndex,
  onPageChange,
  onItemsPerPageChange
}: ConversationsTableViewProps) {
  return (
    <div
      className="conversations-table-view"
      style={{
        background: "#ffffff",
        borderRadius: "8px",
        border: "1px solid #e1dfdd",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "16px"
      }}
    >
      <ConversationTable
        paginatedConversations={paginated}
        filteredCount={filteredCount}
        selectedIds={selectedIds}
        onSelectAll={onSelectAll}
        onSelectOne={onSelectOne}
        onBulkDelete={onBulkDelete}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={onSort}
        editingConvId={editingConvId}
        editingTitle={editingTitle}
        onStartEditing={(id, title) => {
          setEditingConvId(id);
          setEditingTitle(title);
        }}
        onEditingTitleChange={setEditingTitle}
        onSaveTitle={onSaveTitle}
        onCancelEditing={() => setEditingConvId(null)}
        onOpenMessageLog={(id) => {
          setSelectedConvId(id);
          setShowLogDrawer(true);
        }}
        onDeleteConversation={onDeleteConversation}
      />

      <ConversationsPagination
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        totalItems={totalItems}
        startIndex={startIndex}
        onPageChange={onPageChange}
        onItemsPerPageChange={onItemsPerPageChange}
      />
    </div>
  );
}
