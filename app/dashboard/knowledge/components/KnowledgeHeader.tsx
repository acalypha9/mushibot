import React from "react";
import { ArrowLeft } from "lucide-react";
import { Collection } from "../types";
import styles from "../knowledge.module.css";

interface KnowledgeHeaderProps {
  selectedCol: Collection;
  onBackToCollections: () => void;
}

export default function KnowledgeHeader({
  selectedCol,
  onBackToCollections,
}: KnowledgeHeaderProps) {
  return (
    <header
      className={styles.collectionHeader}
    >
      <div className={styles.collectionHeading}>
        <h1
          style={{
            fontSize: "20px",
            fontWeight: "700",
            color: "#323130",
            margin: 0,
            letterSpacing: "-0.01em",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          <span
            onClick={onBackToCollections}
            style={{
              cursor: "pointer",
              color: "#742774",
              transition: "color 0.15s ease",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
            title="Back to Knowledge Base collections list"
          >
            <ArrowLeft style={{ width: "16px", height: "16px" }} />
            Knowledge Base
          </span>
          <span style={{ color: "#8a8886", fontWeight: "400" }}>/</span>
          <span className={styles.collectionName}>{selectedCol.name}</span>
        </h1>
        <p style={{ fontSize: "13px", color: "#605e5c", marginTop: "4px" }}>
          Manage document parser pipelines, vector chunking, and AI retrieval settings for this collection.
        </p>
      </div>
    </header>
  );
}
