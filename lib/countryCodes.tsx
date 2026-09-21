"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { ChevronDown, Search, Globe } from "lucide-react";
import { FlagIcon, COUNTRY_CODES } from "./countryFlags";

export {
  type CountryItem,
  FlagIcon,
  COUNTRY_CODES,
  getCountryFlag
} from "./countryFlags";

export {
  splitPhoneNumber,
  extractCountryCodeFromInput,
  combinePhoneNumber,
  formatPhoneNumberWithCountryCode
} from "./phoneNormalization";

export function CountryCodePicker({
  value,
  onChange,
  accentColor = "#742774"
}: {
  value: string;
  onChange: (val: string) => void;
  accentColor?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const cleanVal = value ? (value.startsWith("+") ? value : `+${value}`) : "";
  const selected = cleanVal ? COUNTRY_CODES.find((c) => c.code === cleanVal) || null : null;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return COUNTRY_CODES;
    return COUNTRY_CODES.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div ref={dropdownRef} style={{ position: "relative", display: "inline-block", flexShrink: 0 }}>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "8px 10px",
          height: "100%",
          background: "transparent",
          border: "none",
          color: "inherit",
          fontSize: "13px",
          fontWeight: "600",
          cursor: "pointer",
          userSelect: "none",
          outline: "none"
        }}
        title="Click to select country code"
      >
        {selected ? (
          <>
            <FlagIcon country={selected.country} size={14} />
            <span style={{ fontWeight: "600", letterSpacing: "0.2px" }}>
              {selected.code}
            </span>
          </>
        ) : (
          <>
            <Globe style={{ width: "14px", height: "14px", opacity: 0.6 }} />
            <span style={{ fontWeight: "500", opacity: 0.7, fontSize: "12px" }}>
              Code
            </span>
          </>
        )}
        <ChevronDown style={{ width: "12px", height: "12px", opacity: 0.6, marginLeft: "1px" }} />
      </button>

      {isOpen && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            width: "280px",
            maxHeight: "300px",
            background: "var(--background, #ffffff)",
            color: "var(--foreground, #323130)",
            borderRadius: "10px",
            border: "1px solid var(--border, #e1dfdd)",
            boxShadow: "0 12px 32px rgba(0, 0, 0, 0.18), 0 2px 6px rgba(0,0,0,0.08)",
            zIndex: 99999,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
          }}
        >
          {/* Search Bar */}
          <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--border, #edebe9)", background: "rgba(0,0,0,0.02)" }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Search
                style={{ width: "13px", height: "13px", color: "var(--foreground, #8a8886)", opacity: 0.6, position: "absolute", left: "9px" }}
              />
              <input
                autoFocus
                type="text"
                placeholder="Search country or dial code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && filtered.length > 0) {
                    e.preventDefault();
                    onChange(filtered[0].code);
                    setIsOpen(false);
                  }
                }}
                style={{
                  width: "100%",
                  padding: "6px 8px 6px 28px",
                  borderRadius: "6px",
                  border: "1px solid var(--border, #d1d5db)",
                  background: "var(--background, #ffffff)",
                  color: "var(--foreground, #323130)",
                  fontSize: "12.5px",
                  boxSizing: "border-box",
                  outline: "none"
                }}
              />
            </div>
          </div>

          {/* Countries list */}
          <div style={{ flex: 1, overflowY: "auto", padding: "4px", maxHeight: "220px" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "14px 10px", textAlign: "center", fontSize: "12px", color: "#8a8886" }}>
                No country found matching &quot;{search}&quot;
              </div>
            ) : (
              filtered.map((c) => {
                const isSelected = selected && c.code === selected.code && c.country === selected.country;
                return (
                  <button
                    key={c.code + c.country}
                    type="button"
                    onClick={() => {
                      onChange(c.code);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "7px 10px",
                      borderRadius: "6px",
                      border: "none",
                      background: isSelected ? "rgba(116, 39, 116, 0.12)" : "transparent",
                      color: isSelected ? accentColor : "inherit",
                      fontWeight: isSelected ? "700" : "500",
                      fontSize: "12.5px",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.15s ease"
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "rgba(0,0,0,0.04)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                      <FlagIcon country={c.country} size={14} />
                      <span
                        style={{
                          maxWidth: "165px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {c.name}
                      </span>
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontWeight: "700",
                        fontSize: "11.5px",
                        opacity: 0.85,
                        marginLeft: "6px"
                      }}
                    >
                      {c.code}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
