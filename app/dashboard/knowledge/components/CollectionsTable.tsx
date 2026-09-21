"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatDateCustom } from "@/lib/utils/formatters";
import { Layers, Edit, Trash2 } from "lucide-react";
import { Collection } from "../types";

export interface CollectionsTableProps {
  filteredCollections: Collection[];
  activeCollectionSet: Set<string>;
  onSelectCollection: (col: Collection) => void;
  onSetActiveCollection: (colId: string, e?: React.MouseEvent | React.ChangeEvent) => void;
  onEditCollection: (col: Collection) => void;
  onDeleteCollection: (colId: string, colName: string) => void;
}

export function CollectionsTable({
  filteredCollections,
  activeCollectionSet,
  onSelectCollection,
  onSetActiveCollection,
  onEditCollection,
  onDeleteCollection
}: CollectionsTableProps) {
  return (
    <div style={{ background: "#ffffff", border: "1px solid #e1dfdd", borderRadius: "8px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #e1dfdd", color: "#605e5c", backgroundColor: "#faf9f8" }}>
            <th style={{ padding: "12px 16px", fontWeight: "600" }}>Collection Name</th>
            <th style={{ padding: "12px 16px", fontWeight: "600" }}>Description</th>
            <th style={{ padding: "12px 16px", fontWeight: "600" }}>Documents</th>
            <th style={{ padding: "12px 16px", fontWeight: "600" }}>Chunks</th>
            <th style={{ padding: "12px 16px", fontWeight: "600" }}>Created</th>
            <th style={{ padding: "12px 16px", fontWeight: "600", textAlign: "right" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredCollections.map((col) => {
            const isActiveForAi = activeCollectionSet.has(col.id);
            return (
              <tr
                key={col.id}
                onClick={() => onSelectCollection(col)}
                style={{ borderBottom: "1px solid #f3f2f1", cursor: "pointer", transition: "background 0.15s ease" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#faf9f8")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <td style={{ padding: "12px 16px", fontWeight: "600", color: "#323130" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Layers style={{ width: "16px", height: "16px", color: "#742774" }} />
                    <span>{col.name}</span>
                  </div>
                </td>
                <td style={{ padding: "12px 16px", color: "#605e5c", maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {col.description || "No description"}
                </td>
                <td style={{ padding: "12px 16px", fontWeight: "600" }}>{col.document_count}</td>
                <td style={{ padding: "12px 16px", fontWeight: "600" }}>{col.chunk_count}</td>
                <td style={{ padding: "12px 16px", color: "#605e5c", fontSize: "12px" }}>{formatDateCustom(col.created_at)}</td>
                <td style={{ padding: "12px 16px", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                  <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", alignItems: "center" }}>
                    <label
                      style={{ position: "relative", display: "inline-block", width: "42px", height: "22px", cursor: "pointer" }}
                      title={isActiveForAi ? "Deactivate AI Search for this collection" : "Set as Active for AI Search"}
                    >
                      <Input
                        type="checkbox"
                        checked={isActiveForAi}
                        onChange={(e) => onSetActiveCollection(col.id, e)}
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
                    <Button variant="ghost" size="sm" onClick={() => onEditCollection(col)} title="Edit collection">
                      <Edit style={{ width: "15px", height: "15px" }} />
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => onDeleteCollection(col.id, col.name)} title="Delete collection">
                      <Trash2 style={{ width: "15px", height: "15px" }} />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default CollectionsTable;
