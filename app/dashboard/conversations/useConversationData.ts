"use client";

import { useState, useEffect } from "react";
import { useApiCall } from "@/lib/hooks/useApiCall";
import { Message } from "@/components/chat/message-bubble";
import { Conversation } from "./types";

export interface DeleteModalState {
  show: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

export function useConversationsData(token: string | null) {
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    data: conversations,
    loading,
    error: apiError,
    refetch: fetchConversations,
    setData: setConversations
  } = useApiCall<Conversation[]>(
    "/api/chat/conversations?all_users=true&limit=100",
    token,
    {
      initialData: [],
      transform: (json) => json.items || []
    }
  );

  const errorMsg = actionError || apiError;

  // Real-time auto-sync for conversations list (every 3 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations();
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  return {
    conversations,
    loading,
    errorMsg,
    fetchConversations,
    setConversations,
    setActionError
  };
}

export function useConversationMessages(token: string | null, selectedConvId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgError, setMsgError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function fetchMessages(silent = false) {
      if (!token || !selectedConvId) {
        if (active) setMessages([]);
        return;
      }
      if (!silent && active) {
        setMsgLoading(true);
        setMsgError(null);
      }
      try {
        const res = await fetch(`/api/chat/conversations/${selectedConvId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) {
          if (!silent && active) throw new Error(data.detail || data.error?.message || "Failed to fetch messages");
          return;
        }
        if (active) setMessages(data.messages || []);
      } catch (err) {
        if (!silent && active) setMsgError(err instanceof Error ? err.message : "Error fetching messages");
      } finally {
        if (!silent && active) setMsgLoading(false);
      }
    }

    fetchMessages(false);
    const msgInterval = setInterval(() => {
      fetchMessages(true);
    }, 3000);

    return () => {
      active = false;
      clearInterval(msgInterval);
    };
  }, [token, selectedConvId]);

  return {
    messages,
    msgLoading,
    msgError
  };
}
