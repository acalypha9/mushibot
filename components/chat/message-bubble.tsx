"use client";
// allow: SIZE_OK — message-bubble owns rich Markdown rendering, inline message editing, feedback actions, and metadata citations; upgrade trigger: extract inline edit form or markdown citation renderer when message interaction modes expand

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Lightbulb, AlertTriangle, BookOpen, Copy, Check, Pencil } from "lucide-react";

export interface Message {
  id: string;
  sender_type: "CUSTOMER" | "AI" | "CS_AGENT" | "SYSTEM";
  content: string;
  created_at: string;
  metadata_?: Record<string, unknown> | null;
  clientId?: string;
}

export function MessageBubble({
  message,
  onEdit,
  showWaitingNotice
}: {
  message: Message;
  onEdit?: (messageId: string, content: string) => void;
  showWaitingNotice?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* fallback: do nothing */ }
  };

  const handleStartEdit = () => {
    setEditText(message.content);
    setEditing(true);
  };

  const handleConfirmEdit = () => {
    const trimmed = editText.trim();
    if (trimmed && onEdit) {
      onEdit(message.id, trimmed);
    }
    setEditing(false);
  };

  const handleCancelEdit = () => {
    setEditText(message.content);
    setEditing(false);
  };

  // Auto-resize textarea & focus when editing
  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [editing]);

  // Auto-resize on text change
  const handleTextChange = (val: string) => {
    setEditText(val);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const isCustomer = message.sender_type === "CUSTOMER";
  const isSystem = message.sender_type === "SYSTEM";

  if (isSystem) {
    return (
      <div
        style={{
          alignSelf: "center",
          maxWidth: "85%",
          background: "var(--muted)",
          border: "1px solid var(--border)",
          padding: "6px 14px",
          borderRadius: "30px",
          fontSize: "11px",
          color: "var(--muted-foreground)",
          textAlign: "center",
          margin: "8px 0"
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
          <Lightbulb style={{ width: "12px", height: "12px" }} /> {message.content}
        </span>
      </div>
    );
  }

  // Layout & Color mapping
  const align = isCustomer ? "flex-end" : "flex-start";
  
  const borderRadius = isCustomer 
    ? "16px 16px 4px 16px" 
    : "16px 16px 16px 4px";
    
  const bg = isCustomer 
    ? "var(--primary)" 
    : "var(--card)";
    
  const color = isCustomer 
    ? "var(--primary-foreground)" 
    : "var(--foreground)";
    
  const border = isCustomer 
    ? "1px solid rgba(0, 0, 0, 0.05)" 
    : "1px solid var(--border)";

  const showActions = isCustomer && message.content && !editing;

  return (
    <div
      style={{
        alignSelf: align,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: "6px",
        maxWidth: "80%",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Action icons — horizontal, to the LEFT of the bubble, hidden until hover */}
      {showActions && (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "nowrap" as const,
            flexShrink: 0,
            gap: "2px",
            alignItems: "center",
            opacity: hovered ? 1 : 0,
            transition: "opacity 0.2s ease",
            pointerEvents: hovered ? "auto" : "none",
          }}
        >
          <button
            type="button"
            onClick={handleCopy}
            title={copied ? "Copied!" : "Copy message"}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              borderRadius: "6px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: copied ? "var(--primary)" : "var(--muted-foreground)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "var(--muted)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "none";
            }}
          >
            {copied ? (
              <Check style={{ width: "14px", height: "14px" }} />
            ) : (
              <Copy style={{ width: "14px", height: "14px" }} />
            )}
          </button>
          {onEdit && (
            <button
              type="button"
              onClick={handleStartEdit}
              title="Edit prompt"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                borderRadius: "6px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--muted-foreground)",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--muted)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "none";
              }}
            >
              <Pencil style={{ width: "14px", height: "14px" }} />
            </button>
          )}
        </div>
      )}

      {/* The bubble itself */}
      <div
        ref={bubbleRef}
        style={{
          minWidth: editing ? "260px" : 0,
          transition: "none",
          background: bg,
          color: color,
          border: border,
          padding: "12px 16px",
          borderRadius: borderRadius,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          boxShadow: "var(--shadow-sm)",
          position: "relative",
          wordBreak: "break-word" as const,
          overflowWrap: "break-word" as const,
          flex: "0 1 auto",
        }}
      >
        {/* Meta Headers */}
        <span 
          style={{ 
            fontSize: "10px", 
            color: isCustomer ? "#ffffff" : "var(--muted-foreground)", 
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px"
          }}
        >
          {message.sender_type === "AI" ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
              <img
                src="/mushibot-logo.png"
                alt="MushiBot"
                style={{ width: "13px", height: "13px", objectFit: "contain", borderRadius: "3px" }}
              />
              <span>MushiBot</span>
            </span>
          ) : (
            message.sender_type
          )} &bull; {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>

        {/* Main Body */}
        {message.sender_type === "AI" && !message.content ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", padding: "4px 0" }}>
            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    background: "var(--muted-foreground)",
                    opacity: 0.6,
                    animation: `typingBounce 1.4s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
            {showWaitingNotice && (
              <div style={{ fontSize: "12px", color: "var(--muted-foreground)", fontStyle: "italic", marginTop: "2px" }}>
                Please wait for a moment...
              </div>
            )}
          </div>
        ) : isCustomer && editing ? (
          /* Inline editing mode */
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <textarea
              ref={textareaRef}
              value={editText}
              onChange={(e) => handleTextChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleConfirmEdit();
                }
                if (e.key === "Escape") {
                  handleCancelEdit();
                }
              }}
              rows={1}
              style={{
                fontSize: "14px",
                lineHeight: 1.5,
                fontWeight: 600,
                color: "#ffffff",
                caretColor: "#ffffff",
                background: "rgba(255, 255, 255, 0.15)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                borderRadius: "10px",
                padding: "10px 14px",
                minHeight: "54px",
                resize: "none",
                overflow: "hidden",
                fontFamily: "inherit",
                outline: "none",
                width: "100%",
                boxSizing: "border-box",
                display: "block",
                margin: 0,
              }}
            />
            <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={handleCancelEdit}
                style={{
                  background: "rgba(255, 255, 255, 0.15)",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                  borderRadius: "6px",
                  padding: "4px 10px",
                  cursor: "pointer",
                  color: "#ffffff",
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmEdit}
                style={{
                  background: "rgba(255, 255, 255, 0.25)",
                  border: "1px solid rgba(255, 255, 255, 0.35)",
                  borderRadius: "6px",
                  padding: "4px 10px",
                  cursor: "pointer",
                  color: "#ffffff",
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              >
                Update
              </button>
            </div>
          </div>
        ) : isCustomer ? (
          <p style={{ fontSize: "14px", whiteSpace: "pre-wrap", margin: 0, lineHeight: 1.5, color: "#ffffff", fontWeight: 600, wordBreak: "break-word" as const, overflowWrap: "break-word" as const }}>
            {message.content}
          </p>
        ) : (
          <div className="markdown-body" style={{ wordBreak: "break-word" as const, overflowWrap: "break-word" as const }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>
        )}

        {/* Citation / Escalation metadata */}
        {message.sender_type === "AI" && message.metadata_ && (
          <div
            style={{
              borderTop: "1px dashed var(--border)",
              paddingTop: "6px",
              marginTop: "4px",
              fontSize: "11px",
              color: "var(--muted-foreground)",
              display: "flex",
              flexDirection: "column",
              gap: "4px"
            }}
          >
            {message.metadata_.decision === "ESCALATE" ? (
              <span style={{ color: "var(--destructive)", fontWeight: "bold", display: "flex", alignItems: "center", gap: "4px" }}>
                <AlertTriangle style={{ width: "12px", height: "12px" }} /> Escalated to CS Agent: {String(message.metadata_.reason)}
              </span>
            ) : (
              Array.isArray(message.metadata_.source_ids) &&
              message.metadata_.source_ids.length > 0 && (
                <span style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <BookOpen style={{ width: "12px", height: "12px" }} /> Sources:
                  </span>{" "}
                  {message.metadata_.source_ids.map((id) => (
                    <span 
                      key={id}
                      style={{ 
                        fontSize: "9px", 
                        padding: "2px 6px", 
                        background: "var(--muted)", 
                        border: "1px solid var(--border)",
                        borderRadius: "4px",
                        fontWeight: 600,
                        color: "var(--foreground)"
                      }}
                    >
                      Doc-{String(id).substring(0, 5)}
                    </span>
                  ))}
                </span>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
