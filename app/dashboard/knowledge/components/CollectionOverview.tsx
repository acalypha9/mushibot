"use client";

import React from "react";
import { formatDateCustom } from "@/lib/utils/formatters";
import { FileText, Layers } from "lucide-react";
import { Collection, DocumentItem, KBSettings } from "../types";

interface CollectionOverviewProps {
  selectedCol: Collection;
  documents: DocumentItem[];
  settings: KBSettings;
}

export default function CollectionOverview({
  selectedCol,
  documents,
  settings
}: CollectionOverviewProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", alignItems: "start" }}>
      {/* Left Column: Basic Information Card */}
      <div style={{
        background: "#ffffff",
        border: "1px solid #e1dfdd",
        borderRadius: "8px",
        padding: "24px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        display: "flex",
        flexDirection: "column",
        gap: "20px"
      }}>
        <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#323130", margin: 0 }}>
          Basic Information
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Name */}
          <div>
            <div style={{ fontSize: "12px", color: "#605e5c", fontWeight: "600" }}>Name</div>
            <div style={{ fontSize: "14px", fontWeight: "600", color: "#323130", marginTop: "2px" }}>
              {selectedCol.name}
            </div>
          </div>

          {/* Description */}
          <div>
            <div style={{ fontSize: "12px", color: "#605e5c", fontWeight: "600" }}>Description</div>
            <div style={{ fontSize: "14px", fontWeight: "500", color: "#323130", marginTop: "2px" }}>
              {selectedCol.description || "No description provided"}
            </div>
          </div>

          {/* Created At */}
          <div>
            <div style={{ fontSize: "12px", color: "#605e5c", fontWeight: "600" }}>Created At</div>
            <div style={{ fontSize: "13px", fontWeight: "500", color: "#605e5c", marginTop: "2px" }}>
              {formatDateCustom(selectedCol.created_at)}
            </div>
          </div>

          {/* Updated At */}
          <div>
            <div style={{ fontSize: "12px", color: "#605e5c", fontWeight: "600" }}>Updated At</div>
            <div style={{ fontSize: "13px", fontWeight: "500", color: "#605e5c", marginTop: "2px" }}>
              {formatDateCustom(selectedCol.updated_at || selectedCol.created_at)}
            </div>
          </div>

          {/* Embedding Dimension */}
          <div>
            <div style={{ fontSize: "12px", color: "#605e5c", fontWeight: "600" }}>Embedding Dimension</div>
            <div style={{ fontSize: "13px", fontWeight: "500", color: "#605e5c", marginTop: "2px" }}>
              {selectedCol.embedding_dimension || 1024} dimensions
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Compact Statistics & Model Card */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Statistics Card */}
        <div style={{
          background: "#ffffff",
          border: "1px solid #e1dfdd",
          borderRadius: "8px",
          padding: "18px 20px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          display: "flex",
          flexDirection: "column",
          gap: "12px"
        }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#323130", margin: 0 }}>
            Statistics
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {/* Documents Stat Box */}
            <div style={{
              background: "#faf9f8",
              borderRadius: "6px",
              padding: "12px 10px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              textAlign: "center",
              border: "1px solid #f3f2f1"
            }}>
              <FileText style={{ width: "20px", height: "20px", color: "#742774" }} />
              <div style={{ fontSize: "1.3rem", fontWeight: "700", color: "#323130", lineHeight: 1 }}>
                {documents.length}
              </div>
              <div style={{ fontSize: "11.5px", fontWeight: "600", color: "#605e5c" }}>
                Documents
              </div>
            </div>

            {/* Chunks Stat Box */}
            <div style={{
              background: "#faf9f8",
              borderRadius: "6px",
              padding: "12px 10px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              textAlign: "center",
              border: "1px solid #f3f2f1"
            }}>
              <Layers style={{ width: "20px", height: "20px", color: "#742774" }} />
              <div style={{ fontSize: "1.3rem", fontWeight: "700", color: "#323130", lineHeight: 1 }}>
                {documents.reduce((acc, d) => acc + (d.chunk_count || 0), 0)}
              </div>
              <div style={{ fontSize: "11.5px", fontWeight: "600", color: "#605e5c" }}>
                Chunks
              </div>
            </div>
          </div>
        </div>

        {/* Model Card */}
        <div style={{
          background: "#ffffff",
          border: "1px solid #e1dfdd",
          borderRadius: "8px",
          padding: "18px 20px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          display: "flex",
          flexDirection: "column",
          gap: "14px"
        }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#323130", margin: 0 }}>
            Model
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Embedding Model */}
            <div>
              <div style={{ fontSize: "11.5px", color: "#605e5c", fontWeight: "600" }}>Embedding Model</div>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#323130", marginTop: "2px", fontFamily: "var(--font-body)", display: "flex", alignItems: "center", gap: "6px" }}>
                {selectedCol.embedding_model || settings.embedding_model || "BAAI/bge-m3"}
                <span style={{ fontSize: "11px", background: "#efe5ef", color: "#742774", padding: "1px 6px", borderRadius: "4px" }}>
                  {selectedCol.embedding_dimension || 1024}d
                </span>
              </div>
            </div>

            {/* Parse Model */}
            <div>
              <div style={{ fontSize: "11.5px", color: "#605e5c", fontWeight: "600" }}>Parse Model</div>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#323130", marginTop: "2px", fontFamily: "var(--font-body)" }}>
                LlamaCloud
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
