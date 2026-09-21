"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { Loader2, Eye, Download, Trash2 } from "lucide-react";
import { formatDateCustom, formatBytes } from "@/lib/utils/formatters";
import { DocumentItem, getDisplayTitle, getFileType, renderFileTypeBadge } from "../types";
import { getDocActionAriaLabel } from "./documentsLogic";

interface DocumentRowProps {
  document: DocumentItem;
  isIngesting: boolean;
  onOpenDocDetails: (doc: DocumentItem) => void;
  onDownloadDoc: (doc: DocumentItem) => void;
  onDeleteDoc: (doc: DocumentItem) => void;
}

export default function DocumentRow({
  document: d,
  isIngesting,
  onOpenDocDetails,
  onDownloadDoc,
  onDeleteDoc
}: DocumentRowProps) {
  const fileExt = getFileType(d);
  const title = getDisplayTitle(d);

  return (
    <tr
      style={{
        borderBottom: "1px solid #f3f2f1",
        transition: "background 0.15s ease",
        cursor: "pointer"
      }}
      onClick={() => onOpenDocDetails(d)}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#faf9f8")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <td style={{ padding: "12px 16px", maxWidth: "260px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden" }}>
          {renderFileTypeBadge(fileExt)}
          <span
            title={title}
            style={{
              fontWeight: "600",
              color: "#323130",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}
          >
            {title}
          </span>
        </div>
      </td>

      <td style={{ padding: "12px 16px", color: "#605e5c" }}>{fileExt}</td>

      <td
        style={{
          padding: "12px 16px",
          fontFamily: "var(--font-body)",
          fontSize: "12px",
          color: "#323130"
        }}
      >
        {formatBytes(d.file_size)}
      </td>

      <td
        style={{
          padding: "12px 16px",
          fontFamily: "var(--font-body)",
          fontSize: "12px",
          fontWeight: "600"
        }}
      >
        {d.chunk_count}
      </td>

      <td style={{ padding: "12px 16px", color: "#605e5c", fontSize: "12px" }}>
        {formatDateCustom(d.created_at)}
      </td>

      <td style={{ padding: "12px 16px", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", alignItems: "center" }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenDocDetails(d)}
            title="View Document Details & Chunks"
            aria-label={getDocActionAriaLabel("view", title)}
            style={{ color: "#742774", padding: "4px" }}
          >
            {isIngesting ? (
              <Loader2 className="animate-spin" style={{ width: "16px", height: "16px" }} />
            ) : (
              <Eye style={{ width: "16px", height: "16px" }} />
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDownloadDoc(d)}
            title="Download Document"
            aria-label={getDocActionAriaLabel("download", title)}
            style={{ padding: "4px" }}
          >
            <Download style={{ width: "16px", height: "16px" }} />
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={() => onDeleteDoc(d)}
            title="Delete Document"
            aria-label={getDocActionAriaLabel("delete", title)}
            style={{ padding: "4px" }}
          >
            <Trash2 style={{ width: "16px", height: "16px" }} />
          </Button>
        </div>
      </td>
    </tr>
  );
}
