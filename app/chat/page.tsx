"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "../auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, LayoutDashboard, Pencil } from "lucide-react";
import { api, PaginationEnvelope } from "@/lib/api";
import { ChatWindow } from "@/components/chat/chat-window";
import { ChatSidebar, Conversation, getConversationTitle } from "@/components/chat/chat-sidebar";
import Modal from "@/components/ui/Modal";

export default function ChatPage() {
  const { token, user, loading, logout } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [sessionKey, setSessionKey] = useState<string>("new-0");

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() =>
    typeof window !== "undefined" && localStorage.getItem("csa_chat_sidebar_collapsed") === "true"
  );

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("csa_chat_sidebar_collapsed", String(next));
      return next;
    });
  };

  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<Conversation | null>(null);
  const [renameInput, setRenameInput] = useState("");
  const menuRef = useRef<HTMLDivElement | null>(null);

  const fetchConversations = () => {
    void api.get<PaginationEnvelope<Conversation>>("/api/chat/conversations?channel=WEB")
      .then((data) => setConversations(data.items || []))
      .catch((err) => console.error("Failed to load conversations:", err));
  };

  useEffect(() => {
    if (!loading) {
      if (!token || !user) {
        router.replace("/login");
      } else if (!user.is_active) {
        router.replace("/deactivated");
      } else {
        fetchConversations();
      }
    }
  }, [token, user, loading, router]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading || !token || !user) {
    return null;
  }

  const patchConversation = (id: string, body: Record<string, unknown>) =>
    fetch(`/api/chat/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });

  const handleCreateConversation = () => {
    setSessionKey(`new-${Date.now()}`);
    setActiveConv({ id: "new", status: "OPEN", created_at: new Date().toISOString() });
  };

  const handleSelectConversation = (conv: Conversation) => {
    setSessionKey(conv.id);
    setActiveConv(conv);
  };

  const handleConversationCreated = (newConv: Conversation) => {
    setConversations((prev) => [newConv, ...prev.filter((c) => c.id !== "new")]);
    setActiveConv(newConv);
  };

  const handleTitleUpdated = (convId: string, title: string) => {
    setConversations((prev) => prev.map((c) => (c.id === convId ? { ...c, title } : c)));
    setActiveConv((prev) => (prev && prev.id === convId ? { ...prev, title } : prev));
  };

  const handleTogglePin = async (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpenId(null);
    const updatedPinned = !conv.is_pinned;
    setConversations((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, is_pinned: updatedPinned } : c))
        .sort((a, b) => Number(Boolean(b.is_pinned)) - Number(Boolean(a.is_pinned)))
    );
    try {
      await patchConversation(conv.id, { is_pinned: updatedPinned });
    } catch (err) {
      console.error("Failed to pin conversation:", err);
      fetchConversations();
    }
  };

  const handleStartRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpenId(null);
    setRenameTarget(conv);
    setRenameInput(getConversationTitle(conv));
  };

  const handleConfirmRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget || !renameInput.trim()) return setRenameTarget(null);
    const convId = renameTarget.id;
    const newTitle = renameInput.trim();
    setRenameTarget(null);
    setConversations((prev) => prev.map((c) => (c.id === convId ? { ...c, title: newTitle } : c)));
    if (activeConv?.id === convId) setActiveConv((prev) => (prev ? { ...prev, title: newTitle } : null));
    try {
      await patchConversation(convId, { title: newTitle });
    } catch (err) {
      console.error("Failed to rename conversation:", err);
      fetchConversations();
    }
  };

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpenId(null);
    setConversations((prev) => prev.filter((c) => c.id !== convId));
    if (activeConv?.id === convId) setActiveConv(null);
    try {
      await fetch(`/api/chat/conversations/${convId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {
      console.error("Failed to delete conversation:", err);
      fetchConversations();
    }
  };

  const activeTitle = (!activeConv || activeConv.id === "new")
    ? "New Chat"
    : getConversationTitle(activeConv);

  if (loading || !token || !user || !user.is_active) {
    return null;
  }

  return (
    <main style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--background)", color: "var(--foreground)" }}>
      <ChatSidebar
        conversations={conversations} activeConvId={activeConv?.id || null}
        isSidebarCollapsed={isSidebarCollapsed} menuOpenId={menuOpenId} menuRef={menuRef}
        onToggleSidebar={toggleSidebar} onCreateConversation={handleCreateConversation}
        onSelectConversation={handleSelectConversation} onToggleMenu={setMenuOpenId}
        onTogglePin={handleTogglePin} onStartRename={handleStartRename}
        onDeleteConversation={handleDeleteConversation}
        onLogout={logout}
        user={user}
      />

      <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <header style={{
          flexShrink: 0, padding: "12px var(--space-3)", borderBottom: "1px solid var(--border)",
          display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--card)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h2 style={{ fontSize: "14px", fontWeight: "700", color: "var(--foreground)", margin: 0, fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}>
              {activeTitle}
            </h2>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {user.role === "ADMIN" && (
              <Link
                href="/dashboard"
                className="ui-btn ui-btn-primary ui-btn-sm"
                style={{ textDecoration: "none", fontWeight: "700", fontSize: "12px", letterSpacing: "0.02em" }}
              >
                <LayoutDashboard style={{ width: "14px", height: "14px" }} /> Dashboard
              </Link>
            )}
          </div>
        </header>

        <section style={{ flexGrow: 1, minWidth: 0, background: "var(--card)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {activeConv ? (
            <ChatWindow
              key={sessionKey}
              conversationId={activeConv.id}
              status={activeConv.status}
              onConversationCreated={handleConversationCreated}
              onTitleUpdated={handleTitleUpdated}
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "var(--space-5)", textAlign: "center" }}>
              <div style={{
                width: "56px",
                height: "56px",
                borderRadius: "14px",
                overflow: "hidden",
                boxShadow: "0 6px 20px rgba(116, 39, 116, 0.2)",
                border: "1px solid rgba(116, 39, 116, 0.2)",
                marginBottom: "var(--space-3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#ffffff",
              }}>
                <img
                  src="/mushibot-logo.png"
                  alt="MushiBot"
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              </div>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: "800", color: "var(--foreground)" }}>
                Start a New Chat
              </p>
              <p style={{ fontSize: "14px", color: "var(--muted-foreground)", marginTop: "4px", maxWidth: "24rem" }}>
                Our customer support agents and AI assistant are online and ready to answer your questions.
              </p>
              <button
                onClick={handleCreateConversation}
                style={{
                  marginTop: "var(--space-3)", background: "#742774", color: "#ffffff", border: "none",
                  borderRadius: "var(--radius-sm)", padding: "10px 24px", cursor: "pointer",
                  fontFamily: "var(--font-display)", fontWeight: "bold", fontSize: "14px",
                  boxShadow: "0 4px 12px rgba(116, 39, 116, 0.25)", display: "inline-flex", alignItems: "center", gap: "8px",
                }}
              >
                <Sparkles style={{ width: "16px", height: "16px" }} /> Start Conversation
              </button>
            </div>
          )}
        </section>
      </div>

      <Modal
        isOpen={Boolean(renameTarget)}
        onClose={() => setRenameTarget(null)}
        title="Rename Conversation Title"
        icon={<Pencil style={{ width: "20px", height: "20px", color: "var(--primary)" }} />}
        maxWidth="sm"
      >
        <form onSubmit={handleConfirmRename} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label htmlFor="conversation-title-input" style={{ display: "block", fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "#64748b", marginBottom: "6px" }}>
              Conversation Title
            </label>
            <input
              id="conversation-title-input"
              autoFocus
              type="text"
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              placeholder="Enter conversation title..."
              style={{
                width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1",
                background: "#ffffff", color: "#0E2440", fontSize: "13.5px", fontWeight: "600", outline: "none",
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "4px" }}>
            <button
              type="button"
              onClick={() => setRenameTarget(null)}
              style={{ padding: "9px 18px", borderRadius: "10px", border: "1px solid #cbd5e1", background: "#ffffff", color: "#64748b", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: "9px 20px", borderRadius: "10px", border: "none",
                background: "#742774", color: "#ffffff",
                fontSize: "13px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 12px rgba(116, 39, 116, 0.25)",
              }}
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </main>
  );
}
