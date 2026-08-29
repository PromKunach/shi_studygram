import {
  buildDocumentSearchCatalog,
  defaultNoResultsMessage,
  filterStrictSearchEntries,
  toDocumentMatch,
} from "@/lib/ai/document-search-core";
import { inferSearchQuery } from "@/lib/ai/intent";
import type { AiDocumentMatch } from "@/lib/ai/types";
import { fetchAllDocumentNodes } from "@/lib/documents";

export async function searchDocumentsLocally(
  query: string
): Promise<{ message: string; results: AiDocumentMatch[] }> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { message: "", results: [] };
  }

  const nodes = await fetchAllDocumentNodes();
  const catalog = buildDocumentSearchCatalog(nodes);
  const searchQuery = inferSearchQuery(trimmed) || trimmed;
  const matches = filterStrictSearchEntries(searchQuery, catalog);

  if (matches.length === 0) {
    return {
      message: defaultNoResultsMessage(trimmed),
      results: [],
    };
  }

  const message = /[\u0E00-\u0E7F]/.test(trimmed)
    ? `พบ ${matches.length} เอกสารที่เกี่ยวข้อง`
    : `Found ${matches.length} matching document${matches.length === 1 ? "" : "s"}`;

  return {
    message,
    results: matches.map(toDocumentMatch),
  };
}
