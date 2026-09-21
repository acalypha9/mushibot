"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight
} from "lucide-react";
import { formatDocPaginationRange } from "./documentsLogic";

interface DocumentPaginationProps {
  totalFiltered: number;
  itemsPerPage: number;
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  onSetCurrentPage: (page: number | ((prev: number) => number)) => void;
  onSetItemsPerPage: (count: number) => void;
}

export default function DocumentPagination({
  totalFiltered,
  itemsPerPage,
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  onSetCurrentPage,
  onSetItemsPerPage
}: DocumentPaginationProps) {
  return (
    <div
      style={{
        padding: "12px 20px",
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: "20px",
        fontSize: "12px",
        color: "#605e5c",
        borderTop: "1px solid #e1dfdd",
        backgroundColor: "#faf9f8"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span>Items per page:</span>
        <Select
          value={itemsPerPage}
          onChange={(e) => {
            onSetItemsPerPage(Number(e.target.value));
            onSetCurrentPage(1);
          }}
          style={{ padding: "4px 8px", fontSize: "12px", width: "auto" }}
          aria-label="Items per page"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </Select>
      </div>

      <div>
        {formatDocPaginationRange(totalFiltered, startIndex, endIndex)}
      </div>

      <div style={{ display: "flex", gap: "4px" }}>
        <Button
          variant="ghost"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onSetCurrentPage(1)}
          style={{ padding: "4px" }}
          title="First Page"
          aria-label="First Page"
        >
          <ChevronsLeft style={{ width: "16px", height: "16px" }} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onSetCurrentPage((prev) => Math.max(prev - 1, 1))}
          style={{ padding: "4px" }}
          title="Previous Page"
          aria-label="Previous Page"
        >
          <ChevronLeft style={{ width: "16px", height: "16px" }} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onSetCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          style={{ padding: "4px" }}
          title="Next Page"
          aria-label="Next Page"
        >
          <ChevronRight style={{ width: "16px", height: "16px" }} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onSetCurrentPage(totalPages)}
          style={{ padding: "4px" }}
          title="Last Page"
          aria-label="Last Page"
        >
          <ChevronsRight style={{ width: "16px", height: "16px" }} />
        </Button>
      </div>
    </div>
  );
}
