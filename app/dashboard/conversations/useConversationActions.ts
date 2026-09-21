"use client";

import { useState, Dispatch, SetStateAction } from "react";
import { Conversation } from "./types";
import { DeleteModalState } from "./useConversationData";

interface UseConversationActionsParams {
  token: string | null;
  setConversations: Dispatch<SetStateAction<Conversation[]>>;
  setActionError: (msg: string | null) => void;
  selectedConvId: string | null;
  setSelectedConvId: Dispatch<SetStateAction<string | null>>;
  setShowLogDrawer: Dispatch<SetStateAction<boolean>>;
  selectedIds: string[];
  setSelectedIds: Dispatch<SetStateAction<string[]>>;
  fetchConversations: () => void;
}

export function useConversationActions({
  token,
  setConversations,
  setActionError,
  selectedConvId,
  setSelectedConvId,
  setShowLogDrawer,
  selectedIds,
  setSelectedIds,
  fetchConversations
}: UseConversationActionsParams) {
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    show: false,
    title: "Delete Conversation",
    message: "",
    onConfirm: () => {}
  });

  const handleDeleteConversation = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeleteModal({
      show: true,
      title: "Delete Conversation",
      message: "Are you sure you want to delete this conversation session? This action cannot be undone.",
      onConfirm: async () => {
        setDeleteModal((prev) => ({ ...prev, show: false }));
        try {
          const res = await fetch(`/api/chat/conversations/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!res.ok) throw new Error("Failed to delete conversation");
          setConversations((prev) => prev.filter((c) => c.id !== id));
          if (selectedConvId === id) {
            setSelectedConvId(null);
            setShowLogDrawer(false);
          }
        } catch (err) {
          setActionError(err instanceof Error ? err.message : "Failed to delete");
        }
      }
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setDeleteModal({
      show: true,
      title: "Delete Selected Conversations",
      message: `Are you sure you want to delete ${selectedIds.length} selected conversation(s)? This action cannot be undone.`,
      onConfirm: async () => {
        setDeleteModal((prev) => ({ ...prev, show: false }));
        try {
          await Promise.all(
            selectedIds.map((id) =>
              fetch(`/api/chat/conversations/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
              })
            )
          );
          setConversations((prev) => prev.filter((c) => !selectedIds.includes(c.id)));
          if (selectedConvId && selectedIds.includes(selectedConvId)) {
            setSelectedConvId(null);
            setShowLogDrawer(false);
          }
          setSelectedIds([]);
        } catch {
          setActionError("Failed to delete selected conversations");
        }
      }
    });
  };

  const handleSaveTitle = async (id: string) => {
    if (!editingTitle.trim()) {
      setEditingConvId(null);
      return;
    }
    const newTitle = editingTitle.trim();
    setEditingConvId(null);
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c)));
    try {
      await fetch(`/api/chat/conversations/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title: newTitle })
      });
    } catch (err) {
      console.error("Failed to rename conversation:", err);
      fetchConversations();
    }
  };

  return {
    editingConvId,
    editingTitle,
    setEditingConvId,
    setEditingTitle,
    deleteModal,
    setDeleteModal,
    handleDeleteConversation,
    handleBulkDelete,
    handleSaveTitle
  };
}
