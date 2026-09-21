"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface ConversationsPaginationProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  startIndex: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (size: number) => void;
}

export function ConversationsPagination({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  startIndex,
  onPageChange,
  onItemsPerPageChange
}: ConversationsPaginationProps) {
  return (
    <div style={{ padding: "12px 20px", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "20px", fontSize: "12px", color: "#64748b", borderTop: "1px solid #e2e8f0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span>Items per page:</span>
        <Select
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </Select>
      </div>

      <div>
        {totalItems === 0 ? "0-0 of 0" : `${startIndex + 1}-${Math.min(startIndex + itemsPerPage, totalItems)} of ${totalItems}`}
      </div>

      <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(1)}
          style={{ padding: "4px" }}
          title="First Page"
        >
          <ChevronsLeft style={{ width: "16px", height: "16px" }} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          style={{ padding: "4px" }}
          title="Previous Page"
        >
          <ChevronLeft style={{ width: "16px", height: "16px" }} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          style={{ padding: "4px" }}
          title="Next Page"
        >
          <ChevronRight style={{ width: "16px", height: "16px" }} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(totalPages)}
          style={{ padding: "4px" }}
          title="Last Page"
        >
          <ChevronsRight style={{ width: "16px", height: "16px" }} />
        </Button>
      </div>
    </div>
  );
}
