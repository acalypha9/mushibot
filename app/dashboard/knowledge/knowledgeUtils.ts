import { Collection, DocumentItem } from "./types";

export function updateSelectedColWithEqualityGuard(
  prev: Collection | null,
  cols: Collection[]
): Collection | null {
  if (!prev) return null;
  const updated = cols.find((c) => c.id === prev.id);
  if (!updated) return prev;
  if (
    prev.name === updated.name &&
    prev.description === updated.description &&
    prev.document_count === updated.document_count &&
    prev.chunk_count === updated.chunk_count &&
    prev.embedding_model === updated.embedding_model &&
    prev.embedding_dimension === updated.embedding_dimension &&
    prev.chunk_size === updated.chunk_size &&
    prev.chunk_overlap === updated.chunk_overlap
  ) {
    return prev;
  }
  return updated;
}

export function resolveDownloadFilename(disposition: string | null, doc: DocumentItem): string {
  let filename = "";
  if (disposition) {
    const utf8Match = disposition.match(/filename\*=(?:UTF-8''|utf-8'')([^;]+)/i);
    if (utf8Match && utf8Match[1]) {
      try {
        filename = decodeURIComponent(utf8Match[1].replace(/['"]/g, ""));
      } catch {
        filename = utf8Match[1].replace(/['"]/g, "");
      }
    }
    if (!filename) {
      const standardMatch = disposition.match(/filename=(?:"([^"]+)"|([^;]+))/i);
      if (standardMatch) {
        filename = (standardMatch[1] || standardMatch[2] || "").trim();
      }
    }
  }

  if (!filename) {
    filename = doc.title || "document.md";
    if (!filename.includes(".")) {
      filename += ".md";
    }
  }
  return filename;
}

export function filterCollections(collections: Collection[], query: string): Collection[] {
  if (!query || !query.trim()) return collections;
  const q = query.toLowerCase();
  return collections.filter(
    (c) => (c.name || "").toLowerCase().includes(q) || (c.description || "").toLowerCase().includes(q)
  );
}

export function cleanNumberInput(raw: number | string, min: number, max: number): number | string {
  const cleaned = String(raw).replace(/^0+(?=\d)/, "");
  if (cleaned !== "") {
    let num = parseInt(cleaned, 10);
    if (!isNaN(num)) {
      if (num > max) num = max;
      if (num < min) num = min;
      return num;
    }
  }
  return cleaned === "" ? "" : Number(cleaned);
}

export function sanitizeSettingsNumberInput(
  raw: number | string,
  min: number,
  max: number,
  fallback: number
): number {
  const num = typeof raw === "number" ? raw : Number(raw);
  if (isNaN(num) || num < min) return min ?? fallback;
  if (num > max) return max;
  return num;
}
