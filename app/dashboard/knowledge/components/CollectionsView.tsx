"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Plus,
  Layers,
  FileText,
  Database,
  Sparkles,
  Search,
  PieChart,
  X
} from "lucide-react";
import { Collection, KBSettings } from "../types";
import CollectionCard from "./CollectionCard";
import { CollectionsTable } from "./CollectionsTable";

const cardStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e1dfdd",
  borderRadius: "8px",
  padding: "16px 20px",
  display: "flex",
  alignItems: "center",
  gap: "14px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
};

const iconBoxStyle: React.CSSProperties = {
  width: "42px",
  height: "42px",
  borderRadius: "8px",
  background: "#efe5ef",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#742774",
  flexShrink: 0
};

interface CollectionsViewProps {
  collections: Collection[];
  filteredCollections: Collection[];
  settings: KBSettings;
  activeCollectionSet: Set<string>;
  colSearchInput: string;
  colSearchQuery: string;
  colViewMode: "grid" | "list";
  onSearchInputChange: (val: string) => void;
  onSearchSubmit: (val: string) => void;
  onClearSearch: () => void;
  onViewModeChange: (mode: "grid" | "list") => void;
  onOpenCreateModal: () => void;
  onSelectCollection: (col: Collection) => void;
  onSetActiveCollection: (colId: string, e?: React.MouseEvent | React.ChangeEvent) => void;
  onEditCollection: (col: Collection) => void;
  onDeleteCollection: (colId: string, colName: string) => void;
}

export function getCollectionViewModeVariant(
  activeMode: "grid" | "list",
  targetMode: "grid" | "list"
): "outline" | "ghost" {
  return activeMode === targetMode ? "outline" : "ghost";
}

export default function CollectionsView({
  collections,
  filteredCollections,
  settings,
  activeCollectionSet,
  colSearchInput,
  colSearchQuery,
  colViewMode,
  onSearchInputChange,
  onSearchSubmit,
  onClearSearch,
  onViewModeChange,
  onOpenCreateModal,
  onSelectCollection,
  onSetActiveCollection,
  onEditCollection,
  onDeleteCollection
}: CollectionsViewProps) {
  const totalCollections = collections.length;
  const totalDocumentsAll = collections.reduce((acc, c) => acc + (c.document_count || 0), 0);
  const totalChunksAll = collections.reduce((acc, c) => acc + (c.chunk_count || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#323130", marginTop: "4px", letterSpacing: "-0.01em" }}>Knowledge Base</h1>
          <p style={{ fontSize: "13px", color: "#605e5c", marginTop: "4px" }}>Manage all your knowledge base collections, vector embeddings, and document parsing pipelines.</p>
        </div>
        <Button variant="primary" size="md" onClick={onOpenCreateModal}><Plus style={{ width: "16px", height: "16px" }} /> New Collection</Button>
      </header>

      {/* Stats Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        <div style={cardStyle}>
          <div style={iconBoxStyle}><Layers style={{ width: "22px", height: "22px" }} /></div>
          <div><div style={{ fontSize: "12px", color: "#605e5c", fontWeight: "600" }}>Total Collections</div><div style={{ fontSize: "20px", fontWeight: "700", color: "#323130", marginTop: "2px" }}>{totalCollections}</div></div>
        </div>
        <div style={cardStyle}>
          <div style={iconBoxStyle}><FileText style={{ width: "22px", height: "22px" }} /></div>
          <div><div style={{ fontSize: "12px", color: "#605e5c", fontWeight: "600" }}>Total Documents</div><div style={{ fontSize: "20px", fontWeight: "700", color: "#323130", marginTop: "2px" }}>{totalDocumentsAll}</div></div>
        </div>
        <div style={cardStyle}>
          <div style={iconBoxStyle}><Database style={{ width: "22px", height: "22px" }} /></div>
          <div><div style={{ fontSize: "12px", color: "#605e5c", fontWeight: "600" }}>Total Vector Chunks</div><div style={{ fontSize: "20px", fontWeight: "700", color: "#323130", marginTop: "2px" }}>{totalChunksAll}</div></div>
        </div>
        <div style={cardStyle}>
          <div style={iconBoxStyle}><Sparkles style={{ width: "22px", height: "22px" }} /></div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: "12px", color: "#605e5c", fontWeight: "600" }}>Active Embedding Model</div>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "#323130", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={settings.embedding_model || "BAAI/bge-m3"}>{settings.embedding_model || "BAAI/bge-m3"}</div>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap", marginTop: "4px" }}>
        <div style={{ position: "relative", width: "100%", maxWidth: "320px" }}>
          <Search style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "15px", height: "15px", color: "#605e5c", zIndex: 1 }} />
          <Input type="text" placeholder="Search collections..." value={colSearchInput} onChange={(e) => { onSearchInputChange(e.target.value); if (!e.target.value) onSearchSubmit(""); }} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onSearchSubmit(colSearchInput.trim()); } }} style={{ paddingLeft: "36px", paddingRight: "28px" }} />
          {colSearchInput && (
            <Button variant="ghost" size="sm" onClick={onClearSearch} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", padding: 0, height: "auto", minHeight: "unset" }}><X style={{ width: "14px", height: "14px" }} /></Button>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "12px", color: "#605e5c", fontWeight: "600" }}>Showing {filteredCollections.length} of {collections.length} collections</span>
          <div style={{ display: "flex", background: "#f3f2f1", border: "1px solid #e1dfdd", borderRadius: "6px", padding: "2px" }}>
            <Button variant={getCollectionViewModeVariant(colViewMode, "grid")} size="sm" onClick={() => onViewModeChange("grid")} title="Grid View" style={{ background: colViewMode === "grid" ? "#ffffff" : "transparent" }}><PieChart style={{ width: "14px", height: "14px" }} /> Grid</Button>
            <Button variant={getCollectionViewModeVariant(colViewMode, "list")} size="sm" onClick={() => onViewModeChange("list")} title="List View" style={{ background: colViewMode === "list" ? "#ffffff" : "transparent" }}><FileText style={{ width: "14px", height: "14px" }} /> List</Button>
          </div>
        </div>
      </div>

      {/* Main Content (Grid vs List) */}
      {filteredCollections.length === 0 ? (
        <div style={{ padding: "48px 24px", textAlign: "center", background: "#ffffff", border: "1px dashed #e1dfdd", borderRadius: "8px", color: "#605e5c" }}>
          <Layers style={{ width: "36px", height: "36px", color: "#c8c6c4", margin: "0 auto 12px" }} />
          <div style={{ fontSize: "14px", fontWeight: "600", color: "#323130" }}>{colSearchQuery ? `No collections match "${colSearchQuery}"` : "No knowledge collections found"}</div>
          <p style={{ fontSize: "12px", color: "#605e5c", marginTop: "4px", maxWidth: "400px", margin: "4px auto 16px" }}>{colSearchQuery ? "Try clearing your search query or create a new collection." : "Create your first collection to start uploading documents and generating vector embeddings."}</p>
          {!colSearchQuery && <Button variant="primary" size="md" onClick={onOpenCreateModal}>Create Collection</Button>}
        </div>
      ) : colViewMode === "grid" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
          {filteredCollections.map((col) => (
            <CollectionCard
              key={col.id}
              collection={col}
              isActiveForAi={activeCollectionSet.has(col.id)}
              onSelect={() => onSelectCollection(col)}
              onToggleActive={(e) => onSetActiveCollection(col.id, e)}
              onEdit={() => onEditCollection(col)}
              onDelete={() => onDeleteCollection(col.id, col.name)}
            />
          ))}
        </div>
      ) : (
        <CollectionsTable
          filteredCollections={filteredCollections}
          activeCollectionSet={activeCollectionSet}
          onSelectCollection={onSelectCollection}
          onSetActiveCollection={onSetActiveCollection}
          onEditCollection={onEditCollection}
          onDeleteCollection={onDeleteCollection}
        />
      )}
    </div>
  );
}
