import { describe, expect, it } from "vitest";
import { createDocumentBlock, serializeDocumentContent } from "@/lib/document-blocks";

import {
  buildQueryContentSnippet,
  extractDocumentPlainText,
} from "@/lib/ai/document-content-search";
import {
  buildDocumentSearchCatalog,
  enrichCatalogForAiSearch,
  scoreDocumentRelevance,
} from "@/lib/ai/document-search-core";

describe("document content search", () => {
  it("extracts plain text from document blocks", () => {
    const content = serializeDocumentContent([
      createDocumentBlock("h1", "สูตรคูณ"),
      createDocumentBlock("paragraph", "2 x 2 = 4"),
    ]);

    expect(extractDocumentPlainText(content)).toContain("สูตรคูณ");
    expect(extractDocumentPlainText(content)).toContain("2 x 2 = 4");
  });

  it("builds a short query-aware snippet", () => {
    const text =
      "บทนำยาวมาก ".repeat(20) +
      "สมการกำลังสอง " +
      "บทสรุป ".repeat(20);

    const snippet = buildQueryContentSnippet(text, ["สมการ"]);

    expect(snippet).toContain("สมการกำลังสอง");
    expect(snippet!.length).toBeLessThanOrEqual(210);
  });

  it("scores content locally and sends only snippets to AI", () => {
    const nodes = [
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
        title: "Notes",
        description: "",
        content: serializeDocumentContent([
          createDocumentBlock(
            "paragraph",
            "Pythagorean theorem a^2 + b^2 = c^2"
          ),
        ]),
        drive_url: "",
        icon: "page",
        color: "blue",
        position: 0,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
    ];

    const catalog = buildDocumentSearchCatalog(nodes);
    const page = catalog[0]!;

    expect(scoreDocumentRelevance("pythagorean", page)).toBeGreaterThan(0);

    const enriched = enrichCatalogForAiSearch(catalog, "pythagorean");
    expect(enriched[0]?.contentSnippet).toContain("Pythagorean");
    expect(enriched[0]?.plainTextContent).toBeUndefined();
  });

  it("finds documents when the query only appears in body content", () => {
    const nodes = [
      {
        id: "11111111-1111-1111-1111-111111111111",
        author_pbri_id: "user-1",
        parent_id: null,
        kind: "section" as const,
        title: "วิทยาศาสตร์",
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
        title: "บันทึกคลาส",
        description: "",
        content: serializeDocumentContent([
          createDocumentBlock("paragraph", "กระบวนการสังเคราะห์ด้วยแสงในพืช"),
        ]),
        drive_url: "",
        icon: "page",
        color: "blue",
        position: 0,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
    ];

    const catalog = buildDocumentSearchCatalog(nodes);
    const page = catalog[0]!;

    expect(scoreDocumentRelevance("สังเคราะห์ด้วยแสง", page)).toBeGreaterThan(0);

    const enriched = enrichCatalogForAiSearch(catalog, "สังเคราะห์ด้วยแสง");
    expect(enriched[0]?.contentSnippet).toContain("สังเคราะห์ด้วยแสง");
  });

  it("matches related topics such as species against taxonomy content", () => {
    const nodes = [
      {
        id: "11111111-1111-1111-1111-111111111111",
        author_pbri_id: "user-1",
        parent_id: null,
        kind: "section" as const,
        title: "Biology",
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
        title: "Classification notes",
        description: "",
        content: serializeDocumentContent([
          createDocumentBlock(
            "paragraph",
            "Taxonomy is the science of naming and classifying species."
          ),
        ]),
        drive_url: "",
        icon: "page",
        color: "blue",
        position: 0,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
    ];

    const catalog = buildDocumentSearchCatalog(nodes);
    const page = catalog[0]!;

    expect(scoreDocumentRelevance("species", page)).toBeGreaterThan(0);
    expect(scoreDocumentRelevance("taxonomy", page)).toBeGreaterThan(0);

    const enriched = enrichCatalogForAiSearch(catalog, "species");
    expect(enriched[0]?.contentSnippet?.toLowerCase()).toContain("taxonomy");
  });
});
