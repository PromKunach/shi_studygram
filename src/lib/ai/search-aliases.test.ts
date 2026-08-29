import { describe, expect, it } from "vitest";

import { buildDocumentSearchCatalog } from "@/lib/ai/document-search-core";
import { detectSearchIntent } from "@/lib/ai/intent";
import { scoreDocumentRelevance } from "@/lib/ai/document-search-core";
import {
  queryMatchesTextWithAliases,
  termMatchesHaystackWithAliases,
  textsMatchAcrossAliases,
} from "@/lib/ai/search-aliases";

const mathSectionNodes = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    author_pbri_id: "user-1",
    parent_id: null,
    kind: "section" as const,
    title: "Math",
    description: "",
    content: "",
    drive_url: "",
    icon: "book",
    color: "blue",
    position: 0,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    author_pbri_id: "user-1",
    parent_id: "11111111-1111-1111-1111-111111111111",
    kind: "page" as const,
    title: "Homework",
    description: "",
    content: "",
    drive_url: "",
    icon: "page",
    color: "blue",
    position: 0,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
];

describe("search aliases", () => {
  it("matches Thai and English subject names", () => {
    expect(textsMatchAcrossAliases("คณิตศาสตร์", "math")).toBe(true);
    expect(textsMatchAcrossAliases("math", "คณิต")).toBe(true);
    expect(textsMatchAcrossAliases("วิทยาศาสตร์", "science")).toBe(true);
  });

  it("matches aliases inside haystack text", () => {
    expect(termMatchesHaystackWithAliases("คณิตศาสตร์", "math homework")).toBe(2);
    expect(queryMatchesTextWithAliases("คณิตศาสตร์", "math")).toBe(true);
  });
});

describe("bilingual document search", () => {
  const catalog = buildDocumentSearchCatalog(mathSectionNodes);
  const page = catalog[0]!;

  it("finds English section documents from Thai queries", () => {
    expect(scoreDocumentRelevance("คณิตศาสตร์", page)).toBeGreaterThan(0);
    expect(scoreDocumentRelevance("คณิต", page)).toBeGreaterThan(0);
    expect(detectSearchIntent("คณิตศาสตร์", catalog)).toBe(true);
    expect(detectSearchIntent("เอกสารคณิต", catalog)).toBe(true);
  });
});
