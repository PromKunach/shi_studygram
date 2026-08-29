import { documentNodeHref } from "@/lib/document-ids";
import type { AiDocumentMatch } from "@/lib/ai/types";
import {
  queryMatchesTextWithAliases,
  termMatchesHaystackWithAliases,
} from "@/lib/ai/search-aliases";
import {
  buildQueryContentSnippet,
  CONTENT_SNIPPET_CANDIDATE_COUNT,
  extractDocumentPlainText,
} from "@/lib/ai/document-content-search";

export type DocumentSearchCatalogEntry = {
  id: string;
  title: string;
  description?: string;
  kind: "page" | "folder";
  sectionTitle?: string;
  locationContext?: string;
  contentSnippet?: string;
  plainTextContent?: string;
};

function resolveLocationContext(
  node: DocumentSearchNode,
  nodesById: Map<string, DocumentSearchNode>
) {
  const ancestors: string[] = [];
  let sectionTitle: string | undefined;
  let current: DocumentSearchNode | undefined = node;

  while (current?.parent_id) {
    const parent = nodesById.get(current.parent_id);
    if (!parent) break;

    if (parent.kind === "section") {
      sectionTitle = parent.title;
      ancestors.unshift(parent.title);
      break;
    }

    ancestors.unshift(parent.title);
    current = parent;
  }

  return {
    sectionTitle,
    locationContext: ancestors.length > 0 ? ancestors.join(" > ") : undefined,
  };
}

export function getDocumentSearchHaystack(entry: DocumentSearchCatalogEntry) {
  return normalizeSearchText(
    [
      entry.title,
      entry.description,
      entry.sectionTitle,
      entry.locationContext,
    ]
      .filter(Boolean)
      .join(" ")
  );
}

type DocumentSearchNode = {
  id: string;
  parent_id: string | null;
  kind: "section" | "folder" | "page";
  title: string;
  description?: string;
  content?: string;
};

export const STRICT_SEARCH_MAX_RESULTS = 3;

const SEARCH_STOP_WORDS = new Set([
  "เอกสาร",
  "ที่",
  "เกี่ยวกับ",
  "เกี่ยว",
  "กับ",
  "หา",
  "ค้นหา",
  "ใน",
  "วิชา",
  "คำว่า",
  "และ",
  "ช่วย",
  "ขอ",
  "อยาก",
  "เอา",
  "แนะนำ",
  "เปิด",
  "ดู",
  "หน่อย",
  "บ้าง",
  "อะไร",
  "มี",
  "ให้",
  "ที",
  "นะ",
  "ครับ",
  "ค่ะ",
  "section",
  "about",
  "document",
  "documents",
  "find",
  "search",
  "show",
  "please",
  "want",
  "need",
  "the",
  "a",
  "an",
  "for",
  "of",
  "me",
  "is",
  "there",
  "are",
  "have",
  "that",
  "this",
  "might",
  "may",
  "contains",
  "contain",
  "containing",
  "something",
  "anything",
  "any",
  "could",
  "would",
  "related",
  "regarding",
]);

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function stripSearchFillerWords(query: string) {
  let normalized = normalizeSearchText(query);
  const fillers = [...SEARCH_STOP_WORDS].sort(
    (left, right) => right.length - left.length
  );

  for (const filler of fillers) {
    normalized = normalized.replaceAll(filler, " ");
  }

  return normalized.replace(/\s+/g, " ").trim();
}

export function extractSearchTerms(query: string) {
  const stripped = stripSearchFillerWords(query);
  if (!stripped) return [];

  return stripped
    .split(/[\s,./\-]+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 2 && !SEARCH_STOP_WORDS.has(term));
}

function termMatchesHaystack(term: string, haystack: string) {
  return termMatchesHaystackWithAliases(term, haystack);
}

function getSectionContextText(entry: DocumentSearchCatalogEntry) {
  return normalizeSearchText(
    `${entry.sectionTitle ?? ""} ${entry.locationContext ?? ""}`
  );
}

function scoreSectionContextMatch(
  query: string,
  entry: DocumentSearchCatalogEntry
) {
  const sectionContext = getSectionContextText(entry);
  if (!sectionContext) return 0;

  const normalizedQuery = stripSearchFillerWords(query);

  if (normalizedQuery) {
    if (
      sectionContext.includes(normalizedQuery) ||
      normalizedQuery.includes(sectionContext) ||
      queryMatchesTextWithAliases(normalizedQuery, sectionContext)
    ) {
      return 8;
    }
  }

  const terms = extractSearchTerms(query);
  if (terms.length === 0) return 0;

  let sectionTermMatches = 0;

  for (const term of terms) {
    if (termMatchesHaystack(term, sectionContext) > 0) {
      sectionTermMatches += 1;
    }
  }

  if (sectionTermMatches === 0) return 0;
  if (terms.length === 1) return 6;

  return sectionTermMatches >= Math.ceil(terms.length * 0.5) ? 6 : 0;
}

export function scoreContentRelevance(
  query: string,
  entry: DocumentSearchCatalogEntry
) {
  const plainText = entry.plainTextContent?.trim();
  if (!plainText) return 0;

  const contentHaystack = normalizeSearchText(plainText);
  const normalizedQuery = stripSearchFillerWords(query);

  if (
    normalizedQuery &&
    (contentHaystack.includes(normalizedQuery) ||
      queryMatchesTextWithAliases(normalizedQuery, contentHaystack))
  ) {
    return 12;
  }

  const terms = extractSearchTerms(query);
  if (terms.length === 0) return 0;

  let matchedTerms = 0;
  let totalScore = 0;

  for (const term of terms) {
    const termScore = termMatchesHaystack(term, contentHaystack);
    if (termScore > 0) {
      matchedTerms += 1;
      totalScore += termScore + 1;
    }
  }

  if (matchedTerms === 0) return 0;
  if (terms.length === 1) return Math.max(3, totalScore);

  const requiredMatches = Math.max(1, Math.ceil(terms.length * 0.34));
  if (matchedTerms < requiredMatches) return 0;

  return totalScore;
}

export function scoreDocumentRelevance(
  query: string,
  entry: DocumentSearchCatalogEntry
) {
  const contentScore = scoreContentRelevance(query, entry);

  const sectionScore = scoreSectionContextMatch(query, entry);
  const haystack = getDocumentSearchHaystack(entry);
  const normalizedQuery = stripSearchFillerWords(query);

  if (!haystack && sectionScore === 0) return 0;
  if (
    normalizedQuery &&
    (haystack.includes(normalizedQuery) ||
      queryMatchesTextWithAliases(normalizedQuery, haystack))
  ) {
    return Math.max(sectionScore, 10);
  }

  const terms = extractSearchTerms(query);
  if (terms.length === 0) return sectionScore;

  let matchedTerms = 0;
  let totalScore = 0;
  const matchedTermSet = new Set<string>();

  for (const term of terms) {
    const termScore = termMatchesHaystack(term, haystack);
    if (termScore > 0) {
      matchedTermSet.add(term);
      totalScore += termScore;
    }
  }

  matchedTerms = matchedTermSet.size;

  if (matchedTerms === 0) {
    return Math.max(sectionScore, contentScore);
  }

  if (terms.length === 1) {
    return Math.max(sectionScore, totalScore, contentScore);
  }

  const requiredMatches = Math.max(1, Math.ceil(terms.length * 0.34));
  if (matchedTerms < requiredMatches) {
    return Math.max(sectionScore, contentScore);
  }

  return Math.max(sectionScore, totalScore, contentScore);
}

export function passesStrictRelevance(
  query: string,
  entry: DocumentSearchCatalogEntry
) {
  return scoreDocumentRelevance(query, entry) >= 1;
}

export function filterStrictSearchEntries(
  query: string,
  entries: DocumentSearchCatalogEntry[],
  maxResults = STRICT_SEARCH_MAX_RESULTS
) {
  const terms = extractSearchTerms(query);
  const minScore = 1;

  return entries
    .filter((entry) => entry.kind === "page")
    .map((entry) => ({
      entry,
      score: scoreDocumentRelevance(query, entry),
    }))
    .filter(({ score }) => score >= minScore)
    .sort((left, right) => right.score - left.score)
    .slice(0, maxResults)
    .map(({ entry }) => entry);
}

type RawSearchResult = {
  id?: unknown;
  title?: unknown;
};

type RawSearchPayload = {
  message?: unknown;
  results?: unknown;
};

export function buildDocumentSearchCatalog(
  nodes: DocumentSearchNode[]
): DocumentSearchCatalogEntry[] {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));

  return nodes
    .filter(
      (node): node is DocumentSearchNode & { kind: "page" } =>
        node.kind === "page"
    )
    .map((node) => {
      const location = resolveLocationContext(node, nodesById);

      return {
        id: node.id,
        title: node.title,
        description: node.description?.trim() || undefined,
        kind: node.kind,
        sectionTitle: location.sectionTitle,
        locationContext: location.locationContext,
        plainTextContent: extractDocumentPlainText(node.content ?? ""),
      };
    });
}

export function stripCatalogInternalFields(
  entry: DocumentSearchCatalogEntry
): DocumentSearchCatalogEntry {
  const { plainTextContent, ...publicEntry } = entry;
  return publicEntry;
}

export function enrichCatalogForAiSearch(
  catalog: DocumentSearchCatalogEntry[],
  query: string
): DocumentSearchCatalogEntry[] {
  const terms = extractSearchTerms(query);
  const rankedIds = new Set<string>();

  for (const entry of [...catalog]
    .sort(
      (left, right) =>
        scoreDocumentRelevance(query, right) - scoreDocumentRelevance(query, left)
    )
    .slice(0, CONTENT_SNIPPET_CANDIDATE_COUNT)) {
    rankedIds.add(entry.id);
  }

  for (const entry of [...catalog]
    .filter((item) => scoreContentRelevance(query, item) > 0)
    .sort(
      (left, right) =>
        scoreContentRelevance(query, right) - scoreContentRelevance(query, left)
    )
    .slice(0, CONTENT_SNIPPET_CANDIDATE_COUNT)) {
    rankedIds.add(entry.id);
  }

  return catalog.map((entry) => {
    const { plainTextContent, contentSnippet, ...publicEntry } = entry;

    if (!rankedIds.has(entry.id) || !plainTextContent?.trim()) {
      return publicEntry;
    }

    return {
      ...publicEntry,
      contentSnippet: buildQueryContentSnippet(plainTextContent, terms),
    };
  });
}

export function buildSectionSearchContext(nodes: DocumentSearchNode[]) {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const sections = new Map<
    string,
    { title: string; documents: string[]; folders: string[] }
  >();

  for (const node of nodes) {
    if (node.kind !== "page" && node.kind !== "folder") continue;

    const location = resolveLocationContext(node, nodesById);
    if (!location.sectionTitle) continue;

    const section =
      sections.get(location.sectionTitle) ??
      ({
        title: location.sectionTitle,
        documents: [],
        folders: [],
      } as { title: string; documents: string[]; folders: string[] });

    if (node.kind === "folder") {
      section.folders.push(node.title);
    } else {
      section.documents.push(node.title);
    }

    sections.set(location.sectionTitle, section);
  }

  return [...sections.values()];
}

export function getDocumentSearchSystemPrompt(
  catalog: DocumentSearchCatalogEntry[],
  nodes: DocumentSearchNode[]
) {
  const compactCatalog = catalog.map(
    ({ plainTextContent, contentSnippet, ...entry }) => ({
      id: entry.id,
      title: entry.title,
      description: entry.description,
      section: entry.sectionTitle,
      location: entry.locationContext,
      ...(contentSnippet ? { snippet: contentSnippet } : {}),
    })
  );
  const sectionContext = buildSectionSearchContext(nodes);

  return [
    "You are a helpful librarian for Shi studygram study documents.",
    "Interpret the user's request naturally — they may speak casually, vaguely, or in Thai/English mix.",
    "Examples: 'อยากดูเคมี', 'มีอะไรในวิทย์บ้าง', 'ช่วยหาชีวะหน่อย', 'math worksheets' all mean: find relevant pages.",
    "Use title, description, section, location path, and especially snippet (document body text) to judge what they likely want.",
    "snippet is an excerpt from the document body — use it to match topics, formulas, vocabulary, or phrases that appear inside the page, not only in the title.",
    "When the user mentions words that only appear inside document content, still return those pages.",
    "Treat related concepts as matches — e.g. species ↔ taxonomy/classification, photosynthesis ↔ chlorophyll.",
    "For vague or conversational questions ('is there a document about species?'), interpret the underlying topic generously.",
    "Section names may be Thai or English. Treat equivalents as the same subject.",
    "Examples: math = คณิตศาสตร์, science = วิทยาศาสตร์, biology = ชีววิทยา.",
    "A query may refer to a section name, folder path, topic, or document type inside a section.",
    "Folders are context only. Never return folders as results.",
    "Reply with JSON only. No markdown fences or extra text.",
    'Format: {"message":"<one friendly sentence in the user language>","results":[{"id":"<uuid>","title":"<exact title>"}]}',
    "Rules:",
    "- message must use the same language as the user query (Thai or English).",
    "- message should sound helpful, like a librarian handing over the right materials.",
    "- Return at most 3 page documents, best matches for what the user wants.",
    "- Prefer reasonable matches over returning nothing — partial/topic matches are OK when clearly relevant.",
    "- If the user asks what is in a section, return representative page documents from that section.",
    "- Documents without descriptions can still match through section, location, or snippet.",
    "- ids and titles must come exactly from the catalog.",
    '- If nothing is relevant after interpreting generously, return {"message":"<short helpful no-results sentence>","results":[]}.',
    `Sections: ${JSON.stringify(sectionContext)}`,
    `Catalog: ${JSON.stringify(compactCatalog)}`,
  ].join("\n");
}

function normalizeSearchPayload(payload: RawSearchPayload) {
  const message =
    typeof payload.message === "string" ? payload.message.trim() : "";
  const rawResults = Array.isArray(payload.results) ? payload.results : [];

  const results = rawResults
    .filter((item): item is RawSearchResult => Boolean(item && typeof item === "object"))
    .map((item) => ({
      id: typeof item.id === "string" ? item.id.trim() : "",
      title: typeof item.title === "string" ? item.title.trim() : "",
    }))
    .filter((item) => item.id && item.title);

  return { message, results };
}

export function parseSearchModelOutput(text: string) {
  const trimmed = text.trim();

  try {
    return normalizeSearchPayload(JSON.parse(trimmed) as RawSearchPayload);
  } catch {
    const match = trimmed.match(/\{[\s\S]*"results"[\s\S]*\}/);
    if (!match) {
      return { message: trimmed.split("\n")[0]?.trim() ?? "", results: [] };
    }

    try {
      return normalizeSearchPayload(JSON.parse(match[0]) as RawSearchPayload);
    } catch {
      return { message: trimmed.split("\n")[0]?.trim() ?? "", results: [] };
    }
  }
}

export function toDocumentMatch(
  entry: DocumentSearchCatalogEntry
): AiDocumentMatch {
  return {
    id: entry.id,
    title: entry.title,
    href: documentNodeHref(entry.id),
    kind: entry.kind,
    sectionTitle: entry.sectionTitle,
  };
}

export function applyStrictSearchFilter(
  query: string,
  matches: AiDocumentMatch[],
  catalogById: Map<string, DocumentSearchCatalogEntry>
) {
  const strictEntries = filterStrictSearchEntries(
    query,
    matches
      .map((match) => catalogById.get(match.id))
      .filter((entry): entry is DocumentSearchCatalogEntry => Boolean(entry))
  );

  return strictEntries.map(toDocumentMatch);
}

export function validateSearchResults(
  results: { id: string; title: string }[],
  catalogById: Map<string, DocumentSearchCatalogEntry>
) {
  const seen = new Set<string>();
  const matches: AiDocumentMatch[] = [];

  for (const result of results) {
    if (seen.has(result.id)) continue;

    const entry = catalogById.get(result.id);
    if (!entry || entry.kind !== "page") continue;

    seen.add(result.id);
    matches.push(toDocumentMatch(entry));
  }

  return matches;
}

export function fallbackDocumentSearch(
  query: string,
  catalog: DocumentSearchCatalogEntry[]
) {
  return filterStrictSearchEntries(query, catalog);
}

export function defaultNoResultsMessage(query: string) {
  return /[\u0E00-\u0E7F]/.test(query)
    ? "ไม่พบเอกสารที่ตรงกับคำค้นหา"
    : "No matching documents found.";
}
