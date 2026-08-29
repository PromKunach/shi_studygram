import { generateText } from "ai";

import { getAiModel } from "@/lib/ai/config";
import {
  applyStrictSearchFilter,
  buildDocumentSearchCatalog,
  defaultNoResultsMessage,
  enrichCatalogForAiSearch,
  fallbackDocumentSearch,
  getDocumentSearchSystemPrompt,
  parseSearchModelOutput,
  stripCatalogInternalFields,
  toDocumentMatch,
  validateSearchResults,
} from "@/lib/ai/document-search-core";
import { inferSearchQuery } from "@/lib/ai/intent";
import type { DocumentNodeRecord } from "@/lib/documents";
import { fetchAllDocumentNodes } from "@/lib/documents";

export {
  buildDocumentSearchCatalog,
  buildSectionSearchContext,
  enrichCatalogForAiSearch,
  fallbackDocumentSearch,
  getDocumentSearchHaystack,
  getDocumentSearchSystemPrompt,
  parseSearchModelOutput,
  stripCatalogInternalFields,
  validateSearchResults,
} from "@/lib/ai/document-search-core";
export type { DocumentSearchCatalogEntry } from "@/lib/ai/document-search-core";

export async function searchDocumentsWithAi(
  prompt: string,
  nodes?: DocumentNodeRecord[],
  searchQuery?: string
) {
  const resolvedNodes = nodes ?? (await fetchAllDocumentNodes());
  const catalog = buildDocumentSearchCatalog(resolvedNodes);
  const query = searchQuery ?? inferSearchQuery(prompt);
  const aiCatalog = enrichCatalogForAiSearch(catalog, query);
  const catalogById = new Map(
    catalog.map((entry) => [entry.id, stripCatalogInternalFields(entry)])
  );

  const result = await generateText({
    model: getAiModel(),
    system: getDocumentSearchSystemPrompt(aiCatalog, resolvedNodes),
    prompt,
  });

  const parsed = parseSearchModelOutput(result.text);
  let message = parsed.message;
  const validated = validateSearchResults(parsed.results, catalogById);
  const strictMatches = applyStrictSearchFilter(
    query,
    validated,
    catalogById
  );
  let matches =
    strictMatches.length > 0
      ? strictMatches
      : validated.length > 0
        ? validated
        : [];

  if (matches.length === 0) {
    const fallback = fallbackDocumentSearch(query, catalog);
    matches = fallback.map(toDocumentMatch);

    if (!message && matches.length > 0) {
      message = /[\u0E00-\u0E7F]/.test(query)
        ? "พบเอกสารที่เกี่ยวข้อง:"
        : "Matching documents:";
    }
  }

  if (!message) {
    message =
      matches.length > 0
        ? /[\u0E00-\u0E7F]/.test(query)
          ? "พบเอกสารที่ตรงกับคำค้นหา:"
          : "Matching documents:"
        : defaultNoResultsMessage(query);
  } else if (matches.length === 0) {
    message = defaultNoResultsMessage(query);
  }

  return {
    message,
    results: matches,
  };
}
