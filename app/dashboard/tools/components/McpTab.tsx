import React from "react";
import Button from "@/components/ui/Button";
import { McpServerItem } from "../types";
import { Plus } from "lucide-react";
import McpEmptyState from "./McpEmptyState";
import McpServerRow from "./McpServerRow";

interface McpTabProps {
  mcpServers: McpServerItem[];
  onOpenAddModal: () => void;
  onOpenToolsModal: (srv: McpServerItem) => void;
  onToggleServer: (serverId: string) => void;
  onDeleteServer: (serverId: string) => void;
}

export default function McpTab({
  mcpServers,
  onOpenAddModal,
  onOpenToolsModal,
  onToggleServer,
  onDeleteServer,
}: McpTabProps) {
  const hasServers = mcpServers.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2
            style={{
              fontSize: "18px",
              fontWeight: "800",
              color: "var(--foreground)",
              margin: 0,
            }}
          >
            Model Context Protocol
          </h2>
          <p style={{ fontSize: "13px", color: "var(--muted-foreground)", marginTop: "4px", margin: 0 }}>
            Manage external MCP server connections.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={onOpenAddModal}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Plus style={{ width: "14px", height: "14px" }} /> Add Server
        </Button>
      </div>

      {!hasServers ? (
        <McpEmptyState />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {mcpServers.map((srv) => (
            <McpServerRow
              key={srv.id}
              server={srv}
              onOpenToolsModal={onOpenToolsModal}
              onToggleServer={onToggleServer}
              onDeleteServer={onDeleteServer}
            />
          ))}
        </div>
      )}
    </div>
  );
}
