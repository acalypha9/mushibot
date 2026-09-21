"use client";

import React, { useRef, useEffect } from "react";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Plus, Search, Loader2, Trash2 } from "lucide-react";
import { ProviderIcon } from "../ProviderIcon";
import { ModelProvider, ProviderPreset } from "../types";

interface ProviderSidebarProps {
  activeTab: "chat" | "embedding" | "parser";
  providers: ModelProvider[];
  categoryProviders: ModelProvider[];
  selectedProviderId: string | null;
  onSelectProvider: (id: string) => void;
  showAddMenu: boolean;
  setShowAddMenu: (show: boolean) => void;
  presetSearch: string;
  setPresetSearch: (search: string) => void;
  filteredPresets: ProviderPreset[];
  onAddPreset: (preset: ProviderPreset) => void;
  onDeleteProvider: (id: string) => void;
  loading: boolean;
  saving: boolean;
  hasUnsavedChanges: boolean;
}

export function ProviderSidebar({
  activeTab,
  categoryProviders,
  selectedProviderId,
  onSelectProvider,
  showAddMenu,
  setShowAddMenu,
  presetSearch,
  setPresetSearch,
  filteredPresets,
  onAddPreset,
  onDeleteProvider,
  loading,
  saving,
  hasUnsavedChanges
}: ProviderSidebarProps) {
  const addMenuRef = useRef<HTMLDivElement | null>(null);

  // Close Add Menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
    };
    if (showAddMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showAddMenu, setShowAddMenu]);

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: "12px",
        background: "var(--card)",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "14px"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2
          style={{
            fontSize: "16px",
            fontWeight: "bold",
            color: "var(--foreground)",
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          }}
        >
          Provider Sources
        </h2>

        {/* + ADD BUTTON */}
        <div ref={addMenuRef} style={{ position: "relative" }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAddMenu(!showAddMenu)}
            disabled={saving}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "14px",
              fontWeight: "600",
              color: "var(--primary)"
            }}
          >
            <Plus style={{ width: "16px", height: "16px" }} /> Add
          </Button>

          {/* ADD PRESET DROPDOWN */}
          {showAddMenu && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: "6px",
                width: "240px",
                maxHeight: "320px",
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                boxShadow: "var(--shadow-md)",
                zIndex: 100,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden"
              }}
            >
              <div
                style={{
                  padding: "8px",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <Search style={{ width: "14px", height: "14px", color: "var(--muted-foreground)" }} />
                <Input
                  type="text"
                  placeholder="Search provider..."
                  value={presetSearch}
                  onChange={(e) => setPresetSearch(e.target.value)}
                  style={{
                    width: "100%",
                    border: "none",
                    background: "none",
                    fontSize: "12px",
                    outline: "none"
                  }}
                  autoFocus
                />
              </div>

              <div style={{ overflowY: "auto", flexGrow: 1, padding: "4px 0" }}>
                {filteredPresets.map((preset) => (
                  <Button
                    key={preset.type}
                    variant="ghost"
                    size="sm"
                    onClick={() => onAddPreset(preset)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      justifyContent: "flex-start",
                      fontSize: "13px",
                      color: "var(--foreground)",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      borderRadius: 0
                    }}
                  >
                    <ProviderIcon type={preset.type} size={20} />
                    <span style={{ fontWeight: "500" }}>{preset.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PROVIDER SOURCES LIST */}
      {loading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 0",
            color: "var(--muted-foreground)",
            fontSize: "13px",
            gap: "8px"
          }}
        >
          <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} /> Loading...
        </div>
      ) : categoryProviders.length === 0 ? (
        <div
          style={{
            border: "1px dashed var(--border)",
            borderRadius: "8px",
            padding: "36px 16px",
            textAlign: "center",
            color: "var(--muted-foreground)",
            fontSize: "13px"
          }}
        >
          No provider sources added for <strong>{activeTab.toUpperCase()}</strong>.
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            overflowY: "auto",
            maxHeight: "560px"
          }}
        >
          {categoryProviders.map((p) => {
            const isSelected = p.id === selectedProviderId;
            return (
              <div
                key={p.id}
                onClick={() => onSelectProvider(p.id)}
                style={{
                  border: isSelected ? "1.5px solid var(--border)" : "1px solid transparent",
                  borderRadius: "10px",
                  padding: "12px 14px",
                  background: isSelected ? "var(--accent)" : "transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                  transition: "all 0.15s ease"
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = "var(--muted)";
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = "transparent";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                  <ProviderIcon type={p.provider_type} size={28} />
                  <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span
                        style={{
                          fontWeight: "600",
                          fontSize: "14px",
                          color: "var(--foreground)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {p.name}
                      </span>
                      {isSelected && hasUnsavedChanges && (
                        <span
                          style={{
                            width: "7px",
                            height: "7px",
                            borderRadius: "50%",
                            background: "#d97706",
                            flexShrink: 0
                          }}
                          title="Unsaved changes"
                        />
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--muted-foreground)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {p.base_url || "https://api.openai.com/v1"}
                    </span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteProvider(p.id);
                  }}
                  style={{
                    color: "var(--muted-foreground)",
                    padding: "4px"
                  }}
                  title="Delete Provider Source"
                >
                  <Trash2 style={{ width: "15px", height: "15px" }} />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
