import { parseDocumentContent, stripInlineMarkers } from "@/lib/document-blocks";
import { expandSearchAliases } from "@/lib/ai/search-aliases";

export const CONTENT_SNIPPET_MAX_LENGTH = 200;
export const CONTENT_SNIPPET_CANDIDATE_COUNT = 8;
export const CONTENT_SCORING_MAX_LENGTH = 3000;

export function extractDocumentPlainText(
  raw: string,
  maxLength = CONTENT_SCORING_MAX_LENGTH
) {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  const blocks = parseDocumentContent(trimmed);
  const parts = blocks
    .map((block) => {
      const text = stripInlineMarkers(block.text).replace(/\s+/g, " ").trim();
      if (!text) return "";

      for (const inline of block.inlines ?? []) {
        if (inline.name?.trim()) {
          return `${text} ${inline.name.trim()}`;
        }
      }

      return text;
    })
    .filter(Boolean);

  const joined = parts.join("\n").trim();
  if (!joined) return "";
  if (joined.length <= maxLength) return joined;

  return joined.slice(0, maxLength).trim();
}

function findBestSnippetIndex(plainText: string, terms: string[]) {
  const lowerText = plainText.toLowerCase();

  for (const term of terms) {
    const directIndex = lowerText.indexOf(term.toLowerCase());
    if (directIndex >= 0) return directIndex;

    for (const alias of expandSearchAliases(term)) {
      const aliasIndex = lowerText.indexOf(alias);
      if (aliasIndex >= 0) return aliasIndex;
    }
  }

  return -1;
}

export function buildQueryContentSnippet(
  plainText: string,
  terms: string[],
  maxLength = CONTENT_SNIPPET_MAX_LENGTH
) {
  const text = plainText.trim();
  if (!text) return undefined;
  if (text.length <= maxLength) return text;

  const matchIndex = findBestSnippetIndex(text, terms);
  if (matchIndex < 0) {
    return `${text.slice(0, maxLength).trim()}…`;
  }

  const half = Math.floor(maxLength / 2);
  const start = Math.max(0, matchIndex - half);
  const end = Math.min(text.length, start + maxLength);
  const snippet = text.slice(start, end).trim();

  return `${start > 0 ? "…" : ""}${snippet}${end < text.length ? "…" : ""}`;
}
