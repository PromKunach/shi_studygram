import { describe, expect, it } from "vitest";

import {
  buildDocumentSearchCatalog,
  extractSearchTerms,
  fallbackDocumentSearch,
  filterStrictSearchEntries,
  parseSearchModelOutput,
  scoreDocumentRelevance,
  validateSearchResults,
} from "@/lib/ai/document-search-core";

const nodes = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    author_pbri_id: "user-1",
    parent_id: null,
    kind: "section" as const,
    title: "วิทยาศาสตร์",
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
    title: "ชีววิทยาเบื้องต้น",
    description: "เอกสารวิชาชีวะ การสืบพันธุ์ เซลล์",
    content: "",
    drive_url: "",
    icon: "page",
    color: "blue",
    position: 0,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    author_pbri_id: "user-1",
    parent_id: "11111111-1111-1111-1111-111111111111",
    kind: "folder" as const,
    title: "เคมี",
    content: "",
    drive_url: "",
    icon: "folder",
    color: "green",
    position: 1,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
];

const mathNodes = [
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    author_pbri_id: "user-1",
    parent_id: null,
    kind: "section" as const,
    title: "คณิตศาสตร์",
    content: "",
    drive_url: "",
    icon: "book",
    color: "blue",
    position: 0,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    author_pbri_id: "user-1",
    parent_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    kind: "page" as const,
    title: "แบบฝึกหัด",
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

describe("document search", () => {
  it("builds a searchable catalog from pages only", () => {
    const catalog = buildDocumentSearchCatalog(nodes);

    expect(catalog).toHaveLength(1);
    expect(catalog[0]).toMatchObject({
      id: "22222222-2222-2222-2222-222222222222",
      title: "ชีววิทยาเบื้องต้น",
      sectionTitle: "วิทยาศาสตร์",
      kind: "page" as const,
    });
  });

  it("parses structured search output from the model", () => {
    const parsed = parseSearchModelOutput(
      '{"message":"พบเอกสารชีวะ","results":[{"id":"22222222-2222-2222-2222-222222222222","title":"ชีววิทยาเบื้องต้น"}]}'
    );

    expect(parsed.message).toBe("พบเอกสารชีวะ");
    expect(parsed.results).toHaveLength(1);
  });

  it("validates ids against the catalog and ignores folders", () => {
    const catalog = buildDocumentSearchCatalog(nodes);
    const catalogById = new Map(catalog.map((entry) => [entry.id, entry]));

    const matches = validateSearchResults(
      [
        {
          id: "22222222-2222-2222-2222-222222222222",
          title: "ชีววิทยาเบื้องต้น",
        },
        {
          id: "33333333-3333-3333-3333-333333333333",
          title: "เคมี",
        },
        { id: "missing-id", title: "ไม่มีจริง" },
      ],
      catalogById
    );

    expect(matches).toHaveLength(1);
    expect(matches[0]?.href).toBe(
      "/documents/22222222-2222-2222-2222-222222222222"
    );
  });

  it("falls back to keyword matching when needed", () => {
    const catalog = buildDocumentSearchCatalog(nodes);
    const matches = fallbackDocumentSearch("สืบพันธุ์", catalog);

    expect(matches).toHaveLength(1);
    expect(matches[0]?.title).toBe("ชีววิทยาเบื้องต้น");
  });

  it("includes description in the search catalog", () => {
    const catalog = buildDocumentSearchCatalog(nodes);

    expect(catalog[0]?.description).toBe("เอกสารวิชาชีวะ การสืบพันธุ์ เซลล์");
  });

  it("filters out weak matches in strict search", () => {
    const catalog = buildDocumentSearchCatalog(nodes);

    expect(filterStrictSearchEntries("ชีวะ", catalog)).toHaveLength(1);
    expect(filterStrictSearchEntries("เคมี", catalog)).toHaveLength(0);
    expect(filterStrictSearchEntries("ภาษาไทย", catalog)).toHaveLength(0);
  });

  it("strips filler words from search terms", () => {
    expect(extractSearchTerms("เอกสารที่เกี่ยวกับชีวะ")).toEqual(["ชีวะ"]);
    expect(extractSearchTerms("เอกสารในวิชาคณิตศาสตร์")).toEqual([
      "คณิตศาสตร์",
    ]);
  });

  it("matches documents by section even without description", () => {
    const catalog = buildDocumentSearchCatalog(mathNodes);
    const worksheet = catalog[0];

    expect(worksheet?.description).toBeUndefined();
    expect(filterStrictSearchEntries("คณิตศาสตร์", catalog)).toHaveLength(1);
    expect(filterStrictSearchEntries("คณิต", catalog)).toHaveLength(1);
    expect(scoreDocumentRelevance("คณิตศาสตร์", worksheet!)).toBeGreaterThan(0);
  });

  it("uses section names as search context", () => {
    const catalog = buildDocumentSearchCatalog(nodes);
    const biology = catalog.find((entry) => entry.title.includes("ชีว"));

    expect(biology?.locationContext).toBe("วิทยาศาสตร์");
    expect(filterStrictSearchEntries("วิทยาศาสตร์", catalog)).toHaveLength(1);
    expect(scoreDocumentRelevance("วิทยาศาสตร์", biology!)).toBeGreaterThan(0);
  });

  it("includes nested folder paths in location context", () => {
    const nestedNodes = [
      ...nodes,
      {
        id: "44444444-4444-4444-4444-444444444444",
        author_pbri_id: "user-1",
        parent_id: "11111111-1111-1111-1111-111111111111",
        kind: "folder" as const,
        title: "เคมีพื้นฐาน",
        content: "",
        drive_url: "",
        icon: "folder",
        color: "green",
        position: 2,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "55555555-5555-5555-5555-555555555555",
        author_pbri_id: "user-1",
        parent_id: "44444444-4444-4444-4444-444444444444",
        kind: "page" as const,
        title: "ปฏิกิริยาเคมี",
        description: "สรุปบทเรียน",
        content: "",
        drive_url: "",
        icon: "page",
        color: "blue",
        position: 0,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
    ];

    const catalog = buildDocumentSearchCatalog(nestedNodes);
    const nestedPage = catalog.find((entry) => entry.title === "ปฏิกิริยาเคมี");

    expect(nestedPage?.locationContext).toBe("วิทยาศาสตร์ > เคมีพื้นฐาน");
    expect(filterStrictSearchEntries("เคมีพื้นฐาน", catalog)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: "ปฏิกิริยาเคมี" }),
      ])
    );
  });
});
