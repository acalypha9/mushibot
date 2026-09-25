"use client";

import { useState, useEffect, useRef } from "react";
import { Message } from "./message-bubble";
import { ChatHeader } from "./ChatHeader";
import { ChatMessageList } from "./ChatMessageList";
import { ChatInputBar } from "./ChatInputBar";
import { useChatScroll } from "./useChatScroll";
import { useChatStreamTransport } from "./useChatStreamTransport";
import { api } from "../../lib/api";
import { useBackendHealth } from "../../lib/use-backend-health";
import { Loader2, WifiOff } from "lucide-react";

export function ChatWindow({ 
  conversationId, 
  status,
  onConversationCreated,
  onTitleUpdated
}: { 
  conversationId: string; 
  status: string; 
  onConversationCreated?: (conv: { id: string; status: string; created_at: string; title?: string }) => void;
  onTitleUpdated?: (convId: string, title: string) => void;
}) {
  const backendStatus = useBackendHealth();
  const isInactive = backendStatus !== "online";

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [providerWarning, setProviderWarning] = useState<string | null>(null);
  const [configuredModelsList, setConfiguredModelsList] = useState<{ id: string; name: string; providerName?: string; providerType?: string }[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const { endRef } = useChatScroll({ dependency: messages });
  const prevConvIdRef = useRef(conversationId);

  const {
    streaming,
    isStreamingRef,
    sendPromptToLLM,
    handleStopStreaming,
  } = useChatStreamTransport({
    conversationId,
    status,
    isInactive,
    selectedModel,
    messages,
    setMessages,
    setError,
    onConversationCreated,
    onTitleUpdated,
  });

  const checkProviderStatus = async () => {
    try {
      const res = await api.get<{ configured: boolean; message?: string }>("/api/chat/provider-status");
      setProviderWarning(res.configured ? null : (res.message || "Model provider is not configured or missing an API key. Please set up a provider in Dashboard > Providers."));
    } catch {}
  };

  useEffect(() => {
    checkProviderStatus();
  }, []);

  useEffect(() => {
    const fetchConfiguredModels = async () => {
      try {
        const token = (await import("../../lib/api")).getToken();
        if (!token) return;
        const res = await fetch("/api/providers", { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data)) return;

        const list: { id: string; name: string; providerName?: string; providerType?: string }[] = [];
        for (const p of data) {
          if (!p.is_active || p.category !== "chat") continue;
          const models = p.config?.configured_models || [];
          for (const cm of models) {
            if (cm.is_active !== false) list.push({ id: cm.id, name: cm.name || cm.id, providerName: p.name, providerType: p.provider_type });
          }
          if (models.length === 0 && p.model_name) {
            list.push({ id: `${p.name}/${p.model_name}`, name: p.model_name, providerName: p.name, providerType: p.provider_type });
          }
        }
        setConfiguredModelsList(list);
        if (list.length > 0) {
          setSelectedModel((prev) => {
            if (prev) return prev;
            const convSaved = typeof window !== "undefined" && conversationId && conversationId !== "new" ? localStorage.getItem(`csa_conv_model_${conversationId}`) : null;
            const lastGlobal = typeof window !== "undefined" ? localStorage.getItem("csa_last_selected_model") : null;
            const target = convSaved || lastGlobal;
            return target && list.some((m) => m.id === target) ? target : list[0].id;
          });
        }
      } catch (err) {
        console.error("Failed to fetch configured models:", err);
      }
    };
    fetchConfiguredModels();
  }, []);

  const handleModelChange = async (newModel: string) => {
    setSelectedModel(newModel);
    setError(null);
    checkProviderStatus();
    try {
      localStorage.setItem("csa_last_selected_model", newModel);
      if (conversationId && conversationId !== "new") {
        localStorage.setItem(`csa_conv_model_${conversationId}`, newModel);
        const token = (await import("../../lib/api")).getToken();
        if (token) {
          fetch(`/api/chat/conversations/${conversationId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ model_name: newModel })
          }).catch(() => {});
        }
      }
    } catch (err) {
      console.error("Failed to persist model state:", err);
    }
  };

  const loadMessages = async () => {
    if (conversationId === "new") {
      setMessages([]);
      setLoading(false);
      const lastGlobal = typeof window !== "undefined" ? localStorage.getItem("csa_last_selected_model") : null;
      if (lastGlobal) setSelectedModel(lastGlobal);
      return;
    }
    try {
      setLoading(true);
      const data = await api.get<{ id: string; status: string; model_name?: string; messages: Message[] }>(`/api/chat/conversations/${conversationId}`);
      setMessages(data.messages || []);
      if (data.model_name) {
        setSelectedModel(data.model_name);
        try {
          localStorage.setItem(`csa_conv_model_${conversationId}`, data.model_name);
          localStorage.setItem("csa_last_selected_model", data.model_name);
        } catch {}
      } else {
        const saved = typeof window !== "undefined" ? (localStorage.getItem(`csa_conv_model_${conversationId}`) || localStorage.getItem("csa_last_selected_model")) : null;
        if (saved) setSelectedModel(saved);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setError(null);
    if (prevConvIdRef.current === "new" && conversationId !== "new") {
      prevConvIdRef.current = conversationId;
      return;
    }
    prevConvIdRef.current = conversationId;
    if (!isInactive) loadMessages();
  }, [conversationId, isInactive]);

  if (isInactive) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", background: "var(--muted)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
          <span>Active Conversation: <strong style={{ fontFamily: "var(--font-mono)", color: "var(--foreground)" }}>{conversationId}</strong></span>
          <span style={{ fontSize: "10px", padding: "3px 8px", borderRadius: "10px", background: "var(--border)", color: "var(--muted-foreground)", fontWeight: "bold", textTransform: "uppercase" }}>{status}</span>
        </div>
        <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", padding: "32px", textAlign: "center" }}>
          {backendStatus === "checking" ? (
            <Loader2 style={{ width: "36px", height: "36px", color: "var(--muted-foreground)", animation: "spin 1s linear infinite" }} />
          ) : (
            <WifiOff style={{ width: "36px", height: "36px", color: "var(--destructive)" }} />
          )}
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.1rem", color: "var(--foreground)" }}>
            {backendStatus === "checking" ? "Connecting to AI..." : "AI Backend Offline"}
          </p>
          <p style={{ fontSize: "13px", color: "var(--muted-foreground)", maxWidth: "22rem", lineHeight: "1.6" }}>
            {backendStatus === "checking" ? "Checking if the backend server is reachable..." : "The chat service is not reachable. Please start the backend server and try again."}
          </p>
          {backendStatus === "offline" && (
            <code style={{ fontSize: "12px", padding: "8px 14px", background: "var(--muted)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", color: "var(--foreground)", fontFamily: "var(--font-mono)" }}>
              python -m uvicorn api.main:app --port 8080 --reload
            </code>
          )}
        </div>
        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", background: "var(--muted)", display: "flex", gap: "10px", alignItems: "center" }}>
          <input type="text" disabled placeholder={backendStatus === "checking" ? "Connecting to backend..." : "Chat unavailable — backend is offline"} style={{ flexGrow: 1, padding: "10px 14px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "var(--border)", color: "var(--muted-foreground)", fontFamily: "var(--font-body)", fontSize: "14px", cursor: "not-allowed" }} />
          <button disabled style={{ padding: "10px 20px", background: "var(--border)", color: "var(--muted-foreground)", border: "none", borderRadius: "var(--radius-sm)", cursor: "not-allowed", fontFamily: "var(--font-display)", fontWeight: "bold", fontSize: "13px", textTransform: "uppercase" }}>Send</button>
        </div>
      </div>
    );
  }

  if (loading && messages.length === 0) {
    return (
      <div style={{ display: "flex", flexGrow: 1, alignItems: "center", justifyContent: "center", height: "100%", color: "var(--muted-foreground)", fontSize: "14px" }}>
        <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite", marginRight: "8px" }} /> Loading message history...
      </div>
    );
  }

  return (
    <div className="chat-window" style={{ display: "flex", flexDirection: "column", height: "100%", minWidth: 0, width: "100%", overflow: "hidden" }}>
      <ChatHeader
        conversationId={conversationId}
        status={status}
        configuredModelsList={configuredModelsList}
        selectedModel={selectedModel}
        onModelChange={handleModelChange}
      />
      <ChatMessageList
        messages={messages}
        streaming={streaming}
        onEditMessage={(id, content) => sendPromptToLLM(content, id)}
        providerWarning={providerWarning}
        error={error}
        onDismissError={() => setError(null)}
        endRef={endRef}
      />
      <ChatInputBar
        streaming={streaming}
        isResolved={status === "RESOLVED"}
        hasProviderWarning={Boolean(providerWarning)}
        onSendMessage={sendPromptToLLM}
        onStopStreaming={handleStopStreaming}
      />
      <style jsx>{`
        .chat-window > :global(*) {
          min-width: 0;
          max-width: 100%;
        }
      `}</style>
    </div>
  );
}
