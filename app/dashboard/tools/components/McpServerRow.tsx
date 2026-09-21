import React from "react";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { McpServerItem } from "../types";
import { Cpu, Wrench, Trash2 } from "lucide-react";

interface McpServerRowProps {
  server: McpServerItem;
  onOpenToolsModal: (srv: McpServerItem) => void;
  onToggleServer: (serverId: string) => void;
  onDeleteServer: (serverId: string) => void;
}

export default function McpServerRow({
  server,
  onOpenToolsModal,
  onToggleServer,
  onDeleteServer,
}: McpServerRowProps) {
  const toolCount = (server.tools || []).length;

  return (
    <div
      style={{
        background: "var(--card)",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
        padding: "20px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            background: "var(--muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--secondary)",
          }}
        >
          <Cpu style={{ width: "20px", height: "20px" }} />
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontWeight: "700", fontSize: "15px", color: "var(--foreground)" }}>
              {server.name}
            </span>
            <span
              style={{
                fontSize: "11px",
                padding: "2px 8px",
                borderRadius: "10px",
                background: "var(--muted)",
                color: "var(--secondary)",
                fontWeight: "700",
              }}
            >
              {server.transport}
            </span>
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "var(--muted-foreground)",
              fontFamily: "var(--font-mono)",
              marginTop: "4px",
            }}
          >
            {server.endpoint_url}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenToolsModal(server)}
            style={{
              padding: 0,
              marginTop: "6px",
              color: "var(--secondary)",
              fontSize: "12.5px",
              fontWeight: "700",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Wrench style={{ width: "13px", height: "13px" }} />
            <span>Available tools ({toolCount})</span>
          </Button>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <label
          style={{
            position: "relative",
            display: "inline-block",
            width: "42px",
            height: "22px",
            cursor: "pointer",
          }}
          title={server.is_enabled ? "Disable Server" : "Enable Server"}
        >
          <Input
            type="checkbox"
            checked={server.is_enabled}
            onChange={() => onToggleServer(server.id)}
            style={{ opacity: 0, width: 0, height: 0, position: "absolute" }}
          />
          <span
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: server.is_enabled ? "var(--primary)" : "var(--muted)",
              transition: ".2s",
              borderRadius: "22px",
            }}
          >
            <span
              style={{
                position: "absolute",
                content: '""',
                height: "16px",
                width: "16px",
                left: server.is_enabled ? "23px" : "3px",
                bottom: "3px",
                backgroundColor: "#ffffff",
                transition: ".2s",
                borderRadius: "50%",
                boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
              }}
            />
          </span>
        </label>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onDeleteServer(server.id)}
          style={{ color: "var(--destructive)", padding: "6px" }}
          title="Delete Server"
        >
          <Trash2 style={{ width: "16px", height: "16px" }} />
        </Button>
      </div>
    </div>
  );
}
