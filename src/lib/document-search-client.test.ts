import { describe, expect, it, vi } from "vitest";
import { createDocumentBlock, serializeDocumentContent } from "@/lib/document-blocks";

import { searchDocumentsLocally } from "@/lib/document-search-client";

vi.mock("@/lib/documents", () => ({
  fetchAllDocumentNodes: vi.fn(),
}));

import { fetchAllDocumentNodes } from "@/lib/documents";

const mockedFetchAllDocumentNodes = vi.mocked(fetchAllDocumentNodes);

describe("searchDocumentsLocally", () => {
  it("returns matching pages from title, description, and content", async () => {
    mockedFetchAllDocumentNodes.mockResolvedValue([
      {
        id: "11111111-1111-1111-1111-111111111111",
        author_pbri_id: "user-1",
        parent_id: null,
        kind: "section",
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
        kind: "page",
        title: "บันทึกคลาส",
        description: "",
        content: serializeDocumentContent([
          createDocumentBlock("paragraph", "กระบวนการสังเคราะห์ด้วยแสง"),
        ]),
        drive_url: "",
        icon: "page",
        color: "blue",
        position: 0,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
    ]);

    const result = await searchDocumentsLocally("สังเคราะห์ด้วยแสง");

    expect(result.results).toHaveLength(1);
    expect(result.results[0]?.title).toBe("บันทึกคลาส");
    expect(result.message).toContain("พบ");
  });
});
