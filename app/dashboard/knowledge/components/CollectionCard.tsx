"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatDateCustom } from "@/lib/utils/formatters";
import { Layers, FileText, Database, Edit, Trash2 } from "lucide-react";
import { Collection } from "../types";

export interface CollectionCardProps {
  collection: Collection;
  isActiveForAi: boolean;
  onSelect: () => void;
  onToggleActive: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function CollectionCard({
  collection,
  isActiveForAi,
  onSelect,
  onToggleActive,
  onEdit,
  onDelete
}: CollectionCardProps) {
  return (
    <div
      onClick={onSelect}
      style={{
        background: "#ffffff",
        border: "1px solid #e1dfdd",
        borderRadius: "10px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: "16px",
        cursor: "pointer",
        boxShadow: "0 2px 5px rgba(0,0,0,0.04)",
        transition: "all 0.2s ease",
        position: "relative",
        overflow: "hidden"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#742774";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(116,39,116,0.12)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#e1dfdd";
        e.currentTarget.style.boxShadow = "0 2px 5px rgba(0,0,0,0.04)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              background: "#efe5ef",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#742774",
              flexShrink: 0
            }}
          >
            <Layers style={{ width: "22px", height: "22px" }} />
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <h2
              style={{
                fontSize: "16px",
                fontWeight: "700",
                color: "#323130",
                margin: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }}
              title={collection.name}
            >
              {collection.name}
            </h2>
            <span style={{ fontSize: "11px", color: "#605e5c" }}>
              Created {formatDateCustom(collection.created_at)}
            </span>
          </div>
        </div>

        <p
          style={{
            fontSize: "13px",
            color: "#605e5c",
            margin: 0,
            lineHeight: "1.4",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: "36px"
          }}
        >
          {collection.description || "No description specified"}
        </p>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flexWrap: "wrap",
          fontSize: "12px",
          background: "#faf9f8",
          padding: "8px 12px",
          borderRadius: "6px",
          border: "1px solid #f3f2f1"
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "5px", color: "#323130", fontWeight: "600" }}>
          <FileText style={{ width: "14px", height: "14px", color: "#742774" }} />
          <span>{collection.document_count} Documents</span>
        </span>
        <span style={{ color: "#c8c6c4" }}>•</span>
        <span style={{ display: "flex", alignItems: "center", gap: "5px", color: "#323130", fontWeight: "600" }}>
          <Database style={{ width: "14px", height: "14px", color: "#742774" }} />
          <span>{collection.chunk_count} Chunks</span>
        </span>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid #f3f2f1",
          paddingTop: "12px",
          marginTop: "4px"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label
            style={{
              position: "relative",
              display: "inline-block",
              width: "42px",
              height: "22px",
              cursor: "pointer"
            }}
            title={isActiveForAi ? "Deactivate AI Search for this collection" : "Set as Active for AI Search"}
          >
            <Input
              type="checkbox"
              checked={isActiveForAi}
              onChange={onToggleActive}
              style={{ opacity: 0, width: 0, height: 0, position: "absolute" }}
            />
            <span
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: isActiveForAi ? "var(--primary)" : "#e2e8f0",
                transition: ".2s",
                borderRadius: "22px"
              }}
            >
              <span
                style={{
                  position: "absolute",
                  content: '""',
                  height: "16px",
                  width: "16px",
                  left: isActiveForAi ? "23px" : "3px",
                  bottom: "3px",
                  backgroundColor: "#ffffff",
                  transition: ".2s",
                  borderRadius: "50%",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.15)"
                }}
              />
            </span>
          </label>
          <span style={{ fontSize: "12px", fontWeight: isActiveForAi ? "600" : "500", color: isActiveForAi ? "#742774" : "#605e5c" }}>
            Active Knowledge
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            title="Edit collection"
          >
            <Edit style={{ width: "15px", height: "15px" }} />
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={onDelete}
            title="Delete collection"
          >
            <Trash2 style={{ width: "15px", height: "15px" }} />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Re-export CollectionsTable and its props for backward compatibility
export { CollectionsTable } from "./CollectionsTable";
export type { CollectionsTableProps } from "./CollectionsTable";
