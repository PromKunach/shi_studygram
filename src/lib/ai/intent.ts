import {
  buildDocumentSearchCatalog,
  extractSearchTerms,
  scoreDocumentRelevance,
  type DocumentSearchCatalogEntry,
} from "@/lib/ai/document-search-core";
import { SEARCH_COMMAND_PREFIX } from "@/lib/ai/search-command";
import type { DocumentNodeRecord } from "@/lib/documents";

const EXPLICIT_SEARCH_PATTERNS = [
  /^(?:\/ค้นหา|ค้นหา|หา|find|search|show)\b/i,
  /(?:หา|ค้นหา|find|search)\s*(?:เอกสาร|document)/i,
  /เอกสาร(?:ที่|เกี่ยว|เรื่อง|about)?/i,
  /\b(?:document|documents)\b/i,
  /(?:เปิด|ไปที่|ลิงก์|link)\s*(?:เอกสาร|document)?/i,
];

const CONVERSATIONAL_LOOKUP_PATTERNS = [
  /(?:อยาก|ขอ|ช่วย|เอา|แนะนำ|เปิด|ดู|โชว์|show|give me|I need|looking for)/i,
  /(?:มี|มีอะไร|อะไรบ้าง|ตัวไหน|ไหนบ้าง)/,
  /(?:บ้าง|หน่อย)\s*$/,
];

const APP_HELP_PATTERNS = [
  /(?:how|วิธี).{0,40}(?:use|ใช้).{0,30}(?:app|เว็บ|เว็บไซต์|ระบบ|shi studygram)/i,
  /(?:ฟีเจอร์|feature).{0,30}(?:มี|อะไร|ไหน)/i,
  /(?:appointment|นัดหมาย|ข่าว|news).{0,30}(?:ใช้|ทำ|คือ)/i,
];

const WORKSPACE_INVENTORY_PATTERNS = [
  /(?:หา|ค้นหา|find|search).*(?:อะไร|what).*(?:ได้|can).*(?:บ้าง)?/i,
  /(?:มี|have).*(?:เอกสาร|document|หน้า|page).*(?:อะไร|what).*(?:บ้าง|some)?/i,
  /(?:เอกสาร|document|หน้า|page).*(?:อะไร|what).*(?:บ้าง|available|มี)/i,
  /^(?:มีอะไร|มีเอกสารอะไร|หาได้อะไร|หาเอกสารอะไร)/i,
  /(?:อะไร|what).*(?:บ้าง|available).*(?:ใน|in).*(?:ระบบ|workspace|shi studygram|เว็บ|เอกสาร|document)/i,
  /what (?:documents?|pages?|materials?).*(?:available|do you have|can (?:I|you) find)/i,
  /(?:list|show).*(?:all|available).*(?:documents?|pages?)/i,
];

const VAGUE_INVENTORY_TERMS = new Set([
  "อะไร",
  "บ้าง",
  "ได้",
  "มี",
  "เอกสาร",
  "document",
  "documents",
  "หน้า",
  "page",
  "pages",
  "what",
  "available",
  "all",
  "some",
  "find",
  "search",
  "ค้นหา",
  "หา",
]);

const OPEN_EXPLANATION_PATTERNS = [
  /(?:^|\s)(?:what|why|how|when|who|explain)(?:\s|$)/i,
  /^(?:ช่วย|ขอ)?(?:อธิบาย|แนะนำ)(?:\s|$)/,
  /(?:ทำไม|อย่างไร|คืออะไร|บอกวิธี)/,
  /\?$/,
];

function isWorkspaceInventoryQuestion(query: string) {
  const trimmed = query.trim();
  if (!WORKSPACE_INVENTORY_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return false;
  }

  const inferred = inferSearchQuery(trimmed);
  const terms = extractSearchTerms(inferred);
  const concreteTerms = terms.filter((term) => !VAGUE_INVENTORY_TERMS.has(term));

  return concreteTerms.length === 0;
}

function isSearchCapabilityQuestion(query: string) {
  const trimmed = query.trim();
  const isQuestion =
    /(?:ได้ไหม|ไหม|หรือเปล่า|can you|could you|is it possible)/i.test(
      trimmed
    ) || /[?？]$/.test(trimmed);

  if (!isQuestion) return false;

  return (
    /(?:ค้นหา|search|หา).*(?:เนื้อหา|content|ชื่อ|รายละเอียด|description|title|แทน|instead)/i.test(
      trimmed
    ) ||
    /(?:เนื้อหา|content).*(?:ค้นหา|search|หา)/i.test(trimmed) ||
    /(?:ค้นหา|search).*(?:ด้วย|by|through)/i.test(trimmed)
  );
}

export function normalizeUserSearchQuery(prompt: string) {
  let query = prompt.trim();

  if (query.startsWith(SEARCH_COMMAND_PREFIX)) {
    query = query.slice(SEARCH_COMMAND_PREFIX.length).trim();
  }

  return query.replace(/^(?:ค้นหา|หา|find|search|show)\s+/i, "").trim();
}

/** Strip polite/conversational wrappers so scoring sees the real topic. */
export function inferSearchQuery(prompt: string) {
  let query = normalizeUserSearchQuery(prompt);

  const leadingToken =
    /^(?:ช่วย|ขอ|ได้ไหม|อยาก|เอา|แนะนำ|บอก|หา|ค้นหา|find|search|show|give me|show me|I want|I need|looking for|please)\s*/i;

  let previous = "";
  while (query !== previous) {
    previous = query;
    query = query.replace(leadingToken, "").trim();
  }

  query = query
    .replace(/\s*(?:ให้หน่อย|หน่อย|ที|นะ|ครับ|ค่ะ|ได้ไหม|please)\s*$/i, "")
    .trim();
  query = query
    .replace(/^(?:เอกสาร|document|documents)\s*(?:ที่|about|on|เรื่อง)?\s*/i, "")
    .trim();
  query = query.replace(/^(?:ใน|in)\s+(?:วิชา|subject)\s*/i, "").trim();
  query = query.replace(/^(?:ที่|about|on|เรื่อง)\s*/i, "").trim();
  query = query.replace(/^เกี่ยว(?:กับ|ข้องกับ)?\s*/i, "").trim();

  return query || normalizeUserSearchQuery(prompt);
}

function hasExplicitSearchIntent(prompt: string) {
  return EXPLICIT_SEARCH_PATTERNS.some((pattern) => pattern.test(prompt.trim()));
}

function isAppHelpQuery(query: string) {
  return APP_HELP_PATTERNS.some((pattern) => pattern.test(query));
}

function hasCatalogMatch(
  query: string,
  catalog: DocumentSearchCatalogEntry[],
  minScore: number
) {
  return catalog.some(
    (entry) => scoreDocumentRelevance(query, entry) >= minScore
  );
}

function looksLikeConversationalLookup(query: string) {
  return CONVERSATIONAL_LOOKUP_PATTERNS.some((pattern) => pattern.test(query));
}

function isOpenEndedExplanation(
  query: string,
  catalog: DocumentSearchCatalogEntry[]
) {
  const inferred = inferSearchQuery(query);

  if (hasCatalogMatch(inferred, catalog, 1) || hasCatalogMatch(query, catalog, 1)) {
    return false;
  }

  if (/^(?:ช่วย|ขอ)?(?:สรุป|summary|summarize)\b/i.test(query.trim())) {
    return true;
  }

  return OPEN_EXPLANATION_PATTERNS.some((pattern) => pattern.test(query));
}

export function detectSearchIntent(
  prompt: string,
  catalog: DocumentSearchCatalogEntry[]
) {
  const query = normalizeUserSearchQuery(prompt);
  if (!query) return false;

  if (isSearchCapabilityQuestion(query)) return false;

  if (isWorkspaceInventoryQuestion(query)) return false;

  if (hasExplicitSearchIntent(prompt)) return true;

  if (isAppHelpQuery(query)) return false;

  const inferred = inferSearchQuery(query);

  if (hasCatalogMatch(inferred, catalog, 1) || hasCatalogMatch(query, catalog, 1)) {
    return true;
  }

  if (isOpenEndedExplanation(query, catalog)) return false;

  if (looksLikeConversationalLookup(query)) {
    const terms = extractSearchTerms(inferred);
    return terms.length > 0;
  }

  const terms = extractSearchTerms(inferred);
  if (terms.length > 0 && terms.length <= 4 && hasCatalogMatch(inferred, catalog, 1)) {
    return true;
  }

  return false;
}

export function resolveAiIntent(
  prompt: string,
  nodes: DocumentNodeRecord[]
): { mode: "search"; query: string; prompt: string } | { mode: "chat" } {
  const catalog = buildDocumentSearchCatalog(nodes);
  const query = normalizeUserSearchQuery(prompt);

  if (!query) {
    return { mode: "chat" };
  }

  if (detectSearchIntent(prompt, catalog)) {
    return {
      mode: "search",
      query: inferSearchQuery(query),
      prompt: query,
    };
  }

  return { mode: "chat" };
}
