import React from "react";
import { Cpu } from "lucide-react";

export default function McpEmptyState() {
  return (
    <div
      style={{
        background: "var(--card)",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
        padding: "48px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: "12px",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "12px",
          background: "var(--muted)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--muted-foreground)",
        }}
      >
        <Cpu style={{ width: "24px", height: "24px" }} />
      </div>
      <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--foreground)", margin: 0 }}>
        No MCP Servers Configured
      </h3>
      <p style={{ fontSize: "13px", color: "var(--muted-foreground)", maxWidth: "420px", margin: 0 }}>
        Connect an MCP server to extend AI capabilities with external tools and resources.
      </p>
    </div>
  );
}
