import { afterEach, describe, expect, it } from "vitest";
import { readRecentPages, recordRecentPage } from "./recent-pages";

const STORAGE_KEY = "shistudygram:recent-pages";
const DOC_1 = "11111111-1111-4111-8111-111111111111";
const DOC_2 = "22222222-2222-4222-8222-222222222222";

describe("recent pages", () => {
  afterEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  it("records a document visit at the front of the list", () => {
    recordRecentPage({
      id: DOC_1,
      title: "My doc",
      href: `/documents/${DOC_1}`,
      iconId: "file-text",
    });

    expect(readRecentPages()).toEqual([
      expect.objectContaining({
        id: DOC_1,
        title: "My doc",
        href: `/documents/${DOC_1}`,
        iconId: "file-text",
      }),
    ]);
  });

  it("moves an existing document to the front when revisited", () => {
    recordRecentPage({
      id: DOC_1,
      title: "First doc",
      href: `/documents/${DOC_1}`,
      iconId: "file-text",
    });
    recordRecentPage({
      id: DOC_2,
      title: "Second doc",
      href: `/documents/${DOC_2}`,
      iconId: "file-text",
    });
    recordRecentPage({
      id: DOC_1,
      title: "First doc",
      href: `/documents/${DOC_1}`,
      iconId: "file-text",
    });

    const pages = readRecentPages();
    expect(pages).toHaveLength(2);
    expect(pages[0]?.href).toBe(`/documents/${DOC_1}`);
    expect(pages[1]?.href).toBe(`/documents/${DOC_2}`);
  });

  it("ignores non-document routes", () => {
    recordRecentPage({
      id: "home",
      title: "หน้าหลัก",
      href: "/",
    });
    recordRecentPage({
      id: "news",
      title: "ข่าวสาร",
      href: "/news",
    });
    recordRecentPage({
      id: "appointment",
      title: "กำหนดการณ์",
      href: "/appointment",
    });
    recordRecentPage({
      id: "documents",
      title: "เอกสาร",
      href: "/documents",
    });

    expect(readRecentPages()).toEqual([]);
  });

  it("ignores folder items", () => {
    recordRecentPage({
      id: "11111111-1111-4111-8111-111111111112",
      title: "โฟลเดอร์",
      href: "/documents/11111111-1111-4111-8111-111111111112",
      iconId: "folder",
    });

    expect(readRecentPages()).toEqual([]);
  });

  it("ignores invalid document ids such as student numbers", () => {
    recordRecentPage({
      id: "69302311014",
      title: "bio",
      href: "/documents/69302311014",
      iconId: "file-text",
    });

    expect(readRecentPages()).toEqual([]);
  });

  it("filters stale non-document entries when reading storage", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          id: "news",
          title: "ข่าวสาร",
          href: "/news",
          visitedAt: "2026-01-01T00:00:00.000Z",
        },
        {
          id: DOC_1,
          title: "My doc",
          href: `/documents/${DOC_1}`,
          visitedAt: "2026-01-02T00:00:00.000Z",
          iconId: "file-text",
        },
        {
          id: "69302311014",
          title: "bad link",
          href: "/documents/69302311014",
          visitedAt: "2026-01-03T00:00:00.000Z",
          iconId: "file-text",
        },
      ])
    );

    expect(readRecentPages()).toEqual([
      expect.objectContaining({
        id: DOC_1,
        href: `/documents/${DOC_1}`,
      }),
    ]);
  });
});
