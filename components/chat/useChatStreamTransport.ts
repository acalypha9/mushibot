"use client";

import { useState, useRef } from "react";
import { Message } from "./message-bubble";
import { api } from "../../lib/api";

export interface UseChatStreamTransportOptions {
  conversationId: string;
  status: string;
  isInactive: boolean;
  selectedModel: string;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setError: (err: string | null) => void;
  onConversationCreated?: (conv: {
    id: string;
    status: string;
    created_at: string;
    title?: string;
  }) => void;
  onTitleUpdated?: (convId: string, title: string) => void;
}

export interface UseChatStreamTransportResult {
  streaming: boolean;
  isStreamingRef: React.MutableRefObject<boolean>;
  sendPromptToLLM: (promptContent: string, isEditMessageId?: string) => Promise<void>;
  handleStopStreaming: () => void;
}

export function useChatStreamTransport({
  conversationId,
  status,
  isInactive,
  selectedModel,
  messages,
  setMessages,
  setError,
  onConversationCreated,
  onTitleUpdated,
}: UseChatStreamTransportOptions): UseChatStreamTransportResult {
  const [streaming, setStreaming] = useState(false);
  const isStreamingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const typeOut = async (targetId: string, fullContent: string) => {
    const totalSteps = 80;
    const chunkSize = Math.max(1, Math.ceil(fullContent.length / totalSteps));
    for (let i = 0; i < fullContent.length; i += chunkSize) {
      const partial = fullContent.substring(0, Math.min(i + chunkSize, fullContent.length));
      setMessages((prev) =>
        prev.map((m) => (m.id === targetId ? { ...m, content: partial } : m))
      );
      await new Promise((r) => setTimeout(r, 15));
    }
  };

  const setupOptimisticMessages = (promptContent: string, isEditMessageId?: string): string => {
    const initialAiId = `temp-ai-${Date.now()}-1`;
    const aiPlaceholder: Message = {
      id: initialAiId,
      clientId: initialAiId,
      sender_type: "AI",
      content: "",
      created_at: new Date().toISOString(),
    };

    if (!isEditMessageId) {
      const custId = `temp-cust-${Date.now()}`;
      const customerMsg: Message = {
        id: custId,
        clientId: custId,
        sender_type: "CUSTOMER",
        content: promptContent,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, customerMsg, aiPlaceholder]);
      return initialAiId;
    }

    const custIndex = messages.findIndex((m) => m.id === isEditMessageId);
    if (custIndex === -1) return initialAiId;

    const nextMsg = messages[custIndex + 1];
    if (nextMsg && nextMsg.sender_type === "AI") {
      setMessages((prev) => {
        const trimmed = prev.slice(0, custIndex + 2);
        return trimmed.map((m) => {
          if (m.id === isEditMessageId) return { ...m, content: promptContent };
          if (m.id === nextMsg.id) return { ...m, content: "" };
          return m;
        });
      });
      return nextMsg.id;
    }

    setMessages((prev) => [
      ...prev.slice(0, custIndex + 1).map((m) => (m.id === isEditMessageId ? { ...m, content: promptContent } : m)),
      aiPlaceholder,
    ]);
    return initialAiId;
  };

  const pollForBackgroundTurns = async (
    activeId: string,
    authHeaders: Record<string, string>,
    knownIds: Set<string>
  ) => {
    const pollAiId = `temp-ai-poll-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: pollAiId, clientId: pollAiId, sender_type: "AI", content: "", created_at: new Date().toISOString() },
    ]);

    let found = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      await new Promise((r) => setTimeout(r, 1500));
      try {
        const res = await fetch(`/api/chat/conversations/${activeId}`, { headers: authHeaders });
        if (!res.ok) continue;
        const convData = await res.json();
        const newAiMsgs = (convData.messages || []).filter(
          (m: { id: string; sender_type: string }) => m.sender_type === "AI" && !knownIds.has(m.id)
        );

        if (newAiMsgs.length > 0) {
          let currentId = pollAiId;
          for (let i = 0; i < newAiMsgs.length; i++) {
            await typeOut(currentId, newAiMsgs[i].content);
            setMessages((prev) =>
              prev.map((m) => (m.id === currentId ? { ...m, id: newAiMsgs[i].id, content: newAiMsgs[i].content } : m))
            );
            if (i < newAiMsgs.length - 1) {
              currentId = `temp-ai-poll-${Date.now()}-${i}`;
              setMessages((prev) => [
                ...prev,
                { id: currentId, sender_type: "AI", content: "", created_at: new Date().toISOString() },
              ]);
              await new Promise((r) => setTimeout(r, 500));
            }
          }
          found = true;
          break;
        }
      } catch {}
    }
    if (!found) {
      setMessages((prev) => prev.filter((m) => m.id !== pollAiId));
    }
  };

  const sendPromptToLLM = async (promptContent: string, isEditMessageId?: string) => {
    if (status === "RESOLVED" || isInactive) return;
    setError(null);
    setStreaming(true);
    isStreamingRef.current = true;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let activeId = conversationId;
    let pendingCreatedConv: { id: string; status: string; created_at: string; title?: string } | null = null;

    if (activeId === "new") {
      try {
        const newConv = await api.post<{ id: string; status: string; created_at: string }>(
          "/api/chat/conversations",
          { channel: "WEB", model_name: selectedModel }
        );
        activeId = newConv.id;
        pendingCreatedConv = newConv;
        try {
          localStorage.setItem(`csa_conv_model_${activeId}`, selectedModel);
          localStorage.setItem("csa_last_selected_model", selectedModel);
        } catch {}
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to start conversation");
        setStreaming(false);
        isStreamingRef.current = false;
        return;
      }
    }

    const activeAiId = setupOptimisticMessages(promptContent, isEditMessageId);

    try {
      const token = (await import("../../lib/api")).getToken();
      const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const currentKey = `web-msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const res = await fetch(`/api/chat/conversations/${activeId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders, "Idempotency-Key": currentKey },
        body: JSON.stringify({
          content: promptContent,
          model: selectedModel,
          provider_id: selectedModel,
          ...(isEditMessageId ? { edit_message_id: isEditMessageId } : {}),
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error: ${res.status}`);
      }

      const data = await res.json();
      const turns: { message_id: string; content: string }[] = data.turns || [];

      for (const turn of turns) {
        await typeOut(activeAiId, turn.content);
        setMessages((prev) =>
          prev.map((m) => (m.id === activeAiId ? { ...m, id: turn.message_id, content: turn.content } : m))
        );
      }

      if (data.processing) {
        await pollForBackgroundTurns(activeId, authHeaders, new Set(turns.map((t) => t.message_id)));
      }

      if (pendingCreatedConv) {
        onConversationCreated?.({ ...pendingCreatedConv, title: data?.title || pendingCreatedConv.title });
      } else if (data?.title && onTitleUpdated) {
        onTitleUpdated(activeId, data.title);
      }

      setMessages((prev) => {
        const hasEmpty = prev.some((m) => m.id.startsWith("temp-ai-") && !m.content);
        return hasEmpty ? prev.filter((m) => !(m.id.startsWith("temp-ai-") && !m.content)) : prev;
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setMessages((prev) => prev.filter((m) => !(m.id.startsWith("temp-ai-") && !m.content)));
      } else {
        setError(err instanceof Error ? err.message : "Failed to send message. Please retry.");
        setMessages((prev) => prev.filter((m) => !m.id.startsWith("temp-ai-")));
      }
    } finally {
      setStreaming(false);
      isStreamingRef.current = false;
      abortControllerRef.current = null;
    }
  };

  return { streaming, isStreamingRef, sendPromptToLLM, handleStopStreaming };
}
