"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";

interface ToolsPaginationProps {
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  itemsPerPage: number;
  setItemsPerPage: (val: number) => void;
  totalItems: number;
  totalPages: number;
  startIndex: number;
  pageSizeOptions?: number[];
}

export default function ToolsPagination({
  currentPage,
  setCurrentPage,
  itemsPerPage,
  setItemsPerPage,
  totalItems,
  totalPages,
  startIndex,
  pageSizeOptions = [10, 20, 50],
}: ToolsPaginationProps) {
  return (
    <div
      style={{
        padding: "12px 20px",
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: "20px",
        fontSize: "12px",
        color: "var(--muted-foreground)",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span>Items per page:</span>
        <Select
          value={itemsPerPage}
          onChange={(e) => {
            setItemsPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
        >
          {pageSizeOptions.map((sz) => (
            <option key={sz} value={sz}>
              {sz}
            </option>
          ))}
        </Select>
      </div>

      <div>
        {totalItems === 0
          ? "0-0 of 0"
          : `${startIndex + 1}-${Math.min(startIndex + itemsPerPage, totalItems)} of ${totalItems}`}
      </div>

      <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => setCurrentPage(1)}
          title="First Page"
          style={{ padding: "4px" }}
        >
          <ChevronsLeft style={{ width: "16px", height: "16px" }} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          title="Previous Page"
          style={{ padding: "4px" }}
        >
          <ChevronLeft style={{ width: "16px", height: "16px" }} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
          title="Next Page"
          style={{ padding: "4px" }}
        >
          <ChevronRight style={{ width: "16px", height: "16px" }} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => setCurrentPage(totalPages)}
          title="Last Page"
          style={{ padding: "4px" }}
        >
          <ChevronsRight style={{ width: "16px", height: "16px" }} />
        </Button>
      </div>
    </div>
  );
}
