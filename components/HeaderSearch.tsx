"use client";
// allow: SIZE_OK — HeaderSearch owns omnibar keyboard navigation, static action registry, and live collection search; upgrade trigger: extract static registry and result grouping when adding global search providers

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/auth";
import {
  Search,
  BookOpen,
  GitBranch,
  ClipboardList,
  Layout,
  Sparkles,
  Home,
  MessageSquare,
  Settings,
  X,
  Database,
  Users
} from "lucide-react";

export interface HeaderSearchProps {
  onOpenSettings?: () => void;
}

interface SearchItem {
  id: string;
  title: string;
  category: "Services & Pages" | "Quick Actions & Settings" | "Knowledge Collections";
  typeLabel: "Page" | "Action" | "Setting" | "Collection";
  description: string;
  href?: string;
  action?: "open_settings";
  keywords: string[];
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  adminOnly?: boolean;
}

export default function HeaderSearch({ onOpenSettings }: HeaderSearchProps) {
  const router = useRouter();
  const { user, token } = useAuth();

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [collections, setCollections] = useState<any[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsListRef = useRef<HTMLDivElement>(null);

  // Fetch collections from backend API to include dynamic knowledge collection results
  useEffect(() => {
    let active = true;
    async function fetchCollections() {
      if (!token) return;
      try {
        const res = await fetch("/api/knowledge/collections", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok && active) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setCollections(data);
          }
        }
      } catch {
        // Silently handle if collections endpoint fails or is offline
      }
    }
    fetchCollections();
    return () => { active = false; };
  }, [token]);

  // Static Registry of Pages, Features, and Quick Actions
  const staticItems: SearchItem[] = useMemo(() => [
    {
      id: "knowledge",
      title: "Knowledge Base",
      category: "Services & Pages",
      typeLabel: "Page",
      description: "Manage document parsing and vector collections",
      href: "/dashboard/knowledge",
      keywords: ["knowledge", "knowledge base", "collection", "vector", "embedding", "document", "parsing", "rag", "books", "manual", "file", "pdf"],
      icon: BookOpen
    },
    {
      id: "channel",
      title: "Channel Integration",
      category: "Services & Pages",
      typeLabel: "Page",
      description: "Configure chat channels & integrations",
      href: "/dashboard/channel",
      keywords: ["channel", "whatsapp", "telegram", "webchat", "integration", "connect", "qr", "session", "bot", "phone", "social"],
      icon: GitBranch
    },
    {
      id: "conversations",
      title: "Conversations & Handoff",
      category: "Services & Pages",
      typeLabel: "Page",
      description: "Monitor customer chats and agent handoffs",
      href: "/dashboard/conversations",
      keywords: ["conversations", "chat", "message", "handoff", "agent", "customer", "history", "logs", "tickets", "support", "live chat"],
      icon: ClipboardList
    },
    {
      id: "tools",
      title: "Tools & Webhooks",
      category: "Services & Pages",
      typeLabel: "Page",
      description: "Configure API tools and webhooks",
      href: "/dashboard/tools",
      keywords: ["tools", "api", "webhook", "function", "action", "integration", "endpoint", "params", "http", "custom tool"],
      icon: Layout
    },
    {
      id: "providers",
      title: "AI Providers & Models",
      category: "Services & Pages",
      typeLabel: "Page",
      description: "Manage LLM providers and model settings",
      href: "/dashboard/providers",
      keywords: ["ai", "providers", "llm", "model", "openai", "gemini", "groq", "ollama", "api key", "gpt", "bge", "embedding", "configuration"],
      adminOnly: true,
      icon: Sparkles
    },
    {
      id: "users",
      title: "Accounts Management",
      category: "Services & Pages",
      typeLabel: "Page",
      description: "Manage accounts and permissions",
      href: "/dashboard/users",
      keywords: ["users", "team", "agent", "admin", "member", "role", "account", "permission", "staff", "cs agent", "people"],
      adminOnly: true,
      icon: Users
    },
    {
      id: "home",
      title: "Home Dashboard",
      category: "Services & Pages",
      typeLabel: "Page",
      description: "Overview of metrics and system activity",
      href: "/dashboard",
      keywords: ["home", "dashboard", "overview", "metrics", "analytics", "stats", "summary", "main"],
      icon: Home
    },
    {
      id: "chat",
      title: "Customer Chat Playground",
      category: "Services & Pages",
      typeLabel: "Page",
      description: "Test and simulate AI bot responses",
      href: "/chat",
      keywords: ["chat", "interface", "playground", "test", "bot", "ai chat", "widget", "customer simulation"],
      icon: MessageSquare
    },
    {
      id: "settings",
      title: "Account Settings",
      category: "Quick Actions & Settings",
      typeLabel: "Setting",
      description: "Change profile picture and password",
      action: "open_settings",
      keywords: ["settings", "account", "profile", "password", "avatar", "picture", "security", "config", "credentials"],
      icon: Settings
    }
  ], []);

  // Merge static items with dynamic collections items & remove any duplicates
  const allItems: SearchItem[] = useMemo(() => {
    const isAdmin = user?.role === "ADMIN";
    const filteredStatic = staticItems.filter(item => !item.adminOnly || isAdmin);

    const collectionItems: SearchItem[] = collections.map((col) => ({
      id: `collection-${col.id}`,
      title: col.name,
      category: "Knowledge Collections",
      typeLabel: "Collection",
      description: `${col.document_count || 0} document(s) • ${col.chunk_count || 0} chunk(s) • ${col.embedding_model || "BAAI/bge-m3"}`,
      href: `/dashboard/knowledge?collection=${encodeURIComponent(col.id)}`,
      keywords: [
        col.name.toLowerCase(),
        "collection",
        "knowledge",
        col.description ? col.description.toLowerCase() : "",
        col.embedding_model ? col.embedding_model.toLowerCase() : ""
      ],
      icon: Database
    }));

    const combined = [...filteredStatic, ...collectionItems];
    
    // Deduplicate items by title to guarantee no duplicate entries are rendered
    const seenTitles = new Set<string>();
    return combined.filter(item => {
      const lower = item.title.toLowerCase();
      if (seenTitles.has(lower)) return false;
      seenTitles.add(lower);
      return true;
    });
  }, [staticItems, collections, user]);

  // Filter items based on query
  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return [];
    }

    const words = q.split(/\s+/).filter(Boolean);

    return allItems.filter((item) => {
      const titleLower = item.title.toLowerCase();
      const descLower = item.description.toLowerCase();
      const catLower = item.category.toLowerCase();
      const typeLower = item.typeLabel.toLowerCase();
      const hrefLower = (item.href || "").toLowerCase();
      const allText = `${titleLower} ${descLower} ${catLower} ${typeLower} ${hrefLower} ${item.keywords.join(" ")}`;

      return words.every((w) => allText.includes(w));
    });
  }, [allItems, query]);

  // Reset selectedIndex whenever filteredResults changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredResults]);

  // Click Outside Listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Global Keyboard Listener for "/" or "Ctrl+K" / "Cmd+K"
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      if ((e.key === "k" || e.key === "K") && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === "/" && !isInput) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // Handle Item Execution (Navigation or Modal Action)
  const handleSelectItem = (item: SearchItem) => {
    setIsOpen(false);
    setQuery("");

    if (item.action === "open_settings") {
      if (onOpenSettings) onOpenSettings();
    } else if (item.href) {
      router.push(item.href);
      if (item.id.startsWith("collection-")) {
        const colId = item.id.replace("collection-", "");
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("select-knowledge-collection", {
              detail: { id: colId, name: item.title }
            })
          );
        }
      }
    }
  };

  // Keyboard navigation within the dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (filteredResults.length > 0 ? (prev + 1) % filteredResults.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (filteredResults.length > 0 ? (prev - 1 + filteredResults.length) % filteredResults.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        inputRef.current?.blur();
        handleSelectItem(filteredResults[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  // Group items by category for AWS Console structured layout
  const groupedResults = useMemo(() => {
    const groups: { [key: string]: SearchItem[] } = {};
    filteredResults.forEach((item) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredResults]);

  return (
    <div ref={containerRef} style={{ flex: "0 1 440px", position: "relative", margin: "0 16px" }}>
      {/* Search Input Bar */}
      <div style={{ position: "relative", width: "100%", display: "flex", alignItems: "center" }}>
        <div
          style={{
            position: "absolute",
            left: "10px",
            top: "50%",
            transform: "translateY(-50%)",
            color: isOpen ? "#742774" : "#605e5c",
            display: "flex",
            alignItems: "center",
            pointerEvents: "none",
            transition: "color 0.15s ease"
          }}
        >
          <Search style={{ width: "15px", height: "15px" }} />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search..."
          style={{
            width: "100%",
            height: "34px",
            paddingLeft: "32px",
            paddingRight: query ? "32px" : "12px",
            borderRadius: "6px",
            border: isOpen ? "1px solid #742774" : "1px solid rgba(255,255,255,0.2)",
            backgroundColor: "#ffffff",
            color: "#323130",
            fontSize: "13px",
            fontWeight: "500",
            outline: "none",
            boxSizing: "border-box",
            boxShadow: isOpen ? "0 0 0 2px rgba(116, 39, 116, 0.25)" : "none",
            transition: "all 0.15s ease"
          }}
        />

        {/* Clear Button (X) when text is typed */}
        {query ? (
          <div style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center" }}>
            <button
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              style={{
                background: "none",
                border: "none",
                color: "#605e5c",
                cursor: "pointer",
                padding: "3px",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              title="Clear search"
            >
              <X style={{ width: "14px", height: "14px" }} />
            </button>
          </div>
        ) : null}
      </div>

      {/* Clean Light-Blurred Dropdown Results Overlay - ONLY shown when input text exists */}
      {isOpen && query.trim() !== "" && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            width: "100%",
            minWidth: "420px",
            maxHeight: "400px",
            backgroundColor: "rgba(255, 255, 255, 0.88)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderRadius: "8px",
            boxShadow: "0 12px 32px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.06)",
            border: "1px solid rgba(225, 223, 221, 0.8)",
            zIndex: 500,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column"
          }}
        >
          {/* Results List */}
          <div
            ref={resultsListRef}
            style={{
              overflowY: "auto",
              padding: "6px 0",
              flexGrow: 1
            }}
          >
            {filteredResults.length === 0 ? (
              <div
                style={{
                  padding: "24px 16px",
                  textAlign: "center",
                  color: "#605e5c"
                }}
              >
                <Search style={{ width: "28px", height: "28px", color: "#a19f9d", margin: "0 auto 8px auto" }} />
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#323130" }}>
                  No matching results found
                </div>
              </div>
            ) : (
              letFlatIndexCounter(groupedResults, selectedIndex, setSelectedIndex, handleSelectItem)
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Render helper to render grouped results while maintaining global selectedIndex tracking
function letFlatIndexCounter(
  groupedResults: { [key: string]: SearchItem[] },
  selectedIndex: number,
  setSelectedIndex: (idx: number) => void,
  onSelect: (item: SearchItem) => void
) {
  let currentIndex = 0;

  return Object.entries(groupedResults).map(([category, items]) => (
    <div key={category} style={{ marginBottom: "4px" }}>
      {/* Group Header Tag */}
      <div
        style={{
          padding: "6px 14px 4px 14px",
          fontSize: "10px",
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: "0.6px",
          color: "#742774",
          display: "flex",
          alignItems: "center",
          gap: "6px"
        }}
      >
        <span>{category}</span>
        <span style={{ height: "1px", flexGrow: 1, backgroundColor: "#efe5ef" }} />
      </div>

      {/* Group Items */}
      {items.map((item) => {
        const itemIdx = currentIndex++;
        const isSelected = itemIdx === selectedIndex;
        const IconComp = item.icon;

        return (
          <div
            key={item.id}
            onClick={() => onSelect(item)}
            onMouseEnter={() => setSelectedIndex(itemIdx)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "8px 14px",
              cursor: "pointer",
              backgroundColor: isSelected ? "rgba(239, 229, 239, 0.85)" : "transparent",
              borderLeft: isSelected ? "3px solid #742774" : "3px solid transparent",
              transition: "all 0.12s ease",
              position: "relative"
            }}
          >
            {/* Left Icon Box */}
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "6px",
                backgroundColor: isSelected ? "#742774" : "#f3e8ff",
                color: isSelected ? "#ffffff" : "#742774",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "all 0.12s ease"
              }}
            >
              <IconComp style={{ width: "16px", height: "16px" }} />
            </div>

            {/* Middle Content */}
            <div style={{ flexGrow: 1, minWidth: 0 }}>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#323130" }}>
                {item.title}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "#605e5c",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  marginTop: "2px"
                }}
              >
                {item.description}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  ));
}
