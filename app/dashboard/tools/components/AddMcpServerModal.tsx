"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-json";
import { Plus, CheckCircle2, AlertCircle } from "lucide-react";
import type { McpServerItem, McpToolItem, McpTemplateType } from "../types";
import { MCP_TEMPLATES, pushEditorHistory, validateAndBuildMcpPayload } from "../utils";

interface AddMcpServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  onServerAdded: (newServer: McpServerItem) => void;
  setSuccessMsg: (msg: string | null) => void;
}

const LABEL_STYLE: React.CSSProperties = {
  fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "var(--muted-foreground)", display: "block", marginBottom: "4px",
};

const CODE_BOX_STYLE: React.CSSProperties = {
  background: "#1e1e1e", borderRadius: "var(--radius-md, 8px)", border: "1px solid #333333", padding: "12px 14px", display: "flex", gap: "12px", fontFamily: "var(--font-mono)", fontSize: "13px", lineHeight: "1.5", maxWidth: "100%", overflow: "hidden",
};

const LINE_NUM_STYLE: React.CSSProperties = {
  display: "flex", flexDirection: "column", userSelect: "none", textAlign: "right", color: "#666666", paddingRight: "10px", borderRight: "1px solid #333333", minWidth: "20px", flexShrink: 0,
};

const EDITOR_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-mono)", fontSize: "13px", lineHeight: "1.5", color: "#d4d4d4", background: "transparent", whiteSpace: "pre-wrap", wordBreak: "break-all", overflowWrap: "anywhere",
};

export default function AddMcpServerModal({
  isOpen,
  onClose,
  token,
  onServerAdded,
  setSuccessMsg,
}: AddMcpServerModalProps) {
  const [mcpServerNameInput, setMcpServerNameInput] = useState("");
  const [mcpTemplateType, setMcpTemplateType] = useState<McpTemplateType | null>(null);
  const [mcpConfigJsonInput, setMcpConfigJsonInput] = useState("");
  const [mcpTesting, setMcpTesting] = useState(false);
  const [mcpTestResult, setMcpTestResult] = useState<string | null>(null);
  const [mcpDiscoveredTools, setMcpDiscoveredTools] = useState<(string | McpToolItem)[]>([]);

  const [history, setHistory] = useState<string[]>([""]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const updateJsonInput = (newVal: string) => {
    setMcpConfigJsonInput(newVal);
    const updated = pushEditorHistory(history, historyIndex, newVal);
    setHistory(updated.history);
    setHistoryIndex(updated.index);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setMcpConfigJsonInput(history[historyIndex - 1] || "");
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setMcpConfigJsonInput(history[historyIndex + 1] || "");
    }
  };

  const handleApplyTemplate = (type: McpTemplateType) => {
    setMcpTemplateType(type);
    setMcpTestResult(null);
    setMcpDiscoveredTools([]);
    updateJsonInput(MCP_TEMPLATES[type]);
  };

  const handleTestMcp = async () => {
    setMcpTesting(true);
    setMcpTestResult(null);
    setMcpDiscoveredTools([]);

    if (!mcpConfigJsonInput.trim()) {
      setMcpTestResult("ERROR: Configuration JSON cannot be empty.");
      setMcpTesting(false);
      return;
    }

    try {
      const res = await fetch("/api/mcp/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ config: mcpConfigJsonInput }),
      });
      const data = await res.json();
      if (data.success) {
        setMcpTestResult(`SUCCESS: ${data.message || "Connected successfully!"}`);
        if (Array.isArray(data.tools)) setMcpDiscoveredTools(data.tools);
      } else {
        setMcpTestResult(`ERROR: ${data.error || "Connection test failed."}`);
      }
    } catch (err) {
      setMcpTestResult(`ERROR: ${err instanceof Error ? err.message : "Failed to execute connection test"}`);
    } finally {
      setMcpTesting(false);
    }
  };

  const handleAddMcpServer = async (e: React.FormEvent) => {
    e.preventDefault();
    setMcpTestResult(null);

    const validation = validateAndBuildMcpPayload(mcpServerNameInput, mcpTemplateType, mcpConfigJsonInput, mcpDiscoveredTools);
    if ("error" in validation) {
      setMcpTestResult(validation.error);
      return;
    }

    try {
      const res = await fetch("/api/mcp/servers", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(validation.payload),
      });
      const data = await res.json();
      if (res.ok) {
        onServerAdded(data);
        onClose();
        setMcpServerNameInput("");
        setMcpDiscoveredTools([]);
        setMcpTestResult(null);
        setSuccessMsg(`MCP Server "${data.name}" added successfully!`);
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setMcpTestResult(`Error: ${data.detail || data.error || "Failed to save MCP server."}`);
      }
    } catch (err: unknown) {
      setMcpTestResult(`Error: ${err instanceof Error ? err.message : "Failed to save MCP server."}`);
    }
  };

  const isSuccess = Boolean(mcpTestResult?.startsWith("SUCCESS"));

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { setMcpTestResult(null); onClose(); }}
      title="Add MCP Server"
      icon={<Plus style={{ width: "20px", height: "20px", color: "var(--primary)" }} />}
      maxWidth="lg"
      footer={
        <>
          <Button type="button" variant="ghost" size="md" onClick={() => { setMcpTestResult(null); onClose(); }} style={{ border: "1px solid var(--border)" }}>
            Cancel
          </Button>
          <Button type="button" variant="ghost" size="md" onClick={handleTestMcp} disabled={mcpTesting} style={{ background: "var(--accent)", color: "var(--primary)" }}>
            {mcpTesting ? "Testing..." : "Test Connection"}
          </Button>
          <Button type="button" variant="primary" size="md" onClick={handleAddMcpServer} disabled={!mcpServerNameInput.trim()}>
            Save
          </Button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <label style={LABEL_STYLE}>Server Name *</label>
          <Input type="text" placeholder="Enter server name..." value={mcpServerNameInput} onChange={(e) => setMcpServerNameInput(e.target.value)} />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <span style={LABEL_STYLE}>Server Configuration</span>
          <div style={{ display: "flex", gap: "8px" }}>
            <Button type="button" variant={mcpTemplateType === "stdio" ? "outline" : "ghost"} size="sm" onClick={() => handleApplyTemplate("stdio")}>
              Stdio Template
            </Button>
            <Button type="button" variant={mcpTemplateType === "streamable_http" ? "outline" : "ghost"} size="sm" onClick={() => handleApplyTemplate("streamable_http")}>
              Streamable HTTP Template
            </Button>
          </div>
        </div>

        <div style={CODE_BOX_STYLE}>
          <div style={LINE_NUM_STYLE}>
            {Array.from({ length: Math.max(1, mcpConfigJsonInput.split("\n").length) }, (_, i) => (
              <span key={i + 1}>{i + 1}</span>
            ))}
          </div>

          <div
            className="mcp-code-editor-container"
            style={{ flex: 1, minHeight: "160px", minWidth: 0, overflow: "hidden" }}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
                e.preventDefault();
                if (e.shiftKey) handleRedo(); else handleUndo();
              } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
                e.preventDefault();
                handleRedo();
              }
            }}
          >
            <Editor
              value={mcpConfigJsonInput}
              onValueChange={updateJsonInput}
              highlight={(code) => Prism.highlight(code, Prism.languages.json || Prism.languages.clike, "json")}
              padding={0}
              style={EDITOR_STYLE}
            />
          </div>
        </div>

        {mcpTestResult && (
          <div
            style={{
              padding: "10px 14px", borderRadius: "var(--radius-md, 8px)", fontSize: "13px", fontWeight: "600",
              display: "flex", alignItems: "flex-start", gap: "8px", width: "100%", maxWidth: "100%", boxSizing: "border-box", overflow: "hidden",
              background: isSuccess ? "#f0fdf4" : "#fef2f2",
              border: `1px solid ${isSuccess ? "#bbf7d0" : "#fecaca"}`,
              color: isSuccess ? "#15803d" : "#dc2626",
            }}
          >
            {isSuccess ? <CheckCircle2 style={{ width: "16px", height: "16px", flexShrink: 0, marginTop: "2px" }} /> : <AlertCircle style={{ width: "16px", height: "16px", flexShrink: 0, marginTop: "2px" }} />}
            <span style={{ wordBreak: "break-all", overflowWrap: "anywhere", whiteSpace: "pre-wrap", flex: 1, minWidth: 0, lineHeight: "1.4" }}>
              {mcpTestResult.replace(/^(SUCCESS:|ERROR:)\s*/, "")}
            </span>
          </div>
        )}
      </div>
    </Modal>
  );
}
