import { afterEach, describe, expect, it } from "vitest";
import { readRecentPages, recordRecentPage } from "./recent-pages";

const STORAGE_KEY = "shistudygram:recent-pages";

describe("recent pages", () => {
  afterEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  it("records a page visit at the front of the list", () => {
    recordRecentPage({
      id: "appointment",
      title: "กำหนดการณ์",
      href: "/appointment",
    });

    expect(readRecentPages()).toEqual([
      expect.objectContaining({
        id: "appointment",
        title: "กำหนดการณ์",
        href: "/appointment",
      }),
    ]);
  });

  it("moves an existing page to the front when revisited", () => {
    recordRecentPage({
      id: "doc-1",
      title: "My doc",
      href: "/documents/doc-1",
      iconId: "file-text",
    });
    recordRecentPage({
      id: "appointment",
      title: "กำหนดการณ์",
      href: "/appointment",
    });
    recordRecentPage({
      id: "doc-1",
      title: "My doc",
      href: "/documents/doc-1",
      iconId: "file-text",
    });

    const pages = readRecentPages();
    expect(pages).toHaveLength(2);
    expect(pages[0]?.href).toBe("/documents/doc-1");
    expect(pages[1]?.href).toBe("/appointment");
  });

  it("ignores the home page", () => {
    recordRecentPage({
      id: "home",
      title: "หน้าหลัก",
      href: "/",
    });

    expect(readRecentPages()).toEqual([]);
  });

  it("ignores the documents list page", () => {
    recordRecentPage({
      id: "documents",
      title: "เอกสาร",
      href: "/documents",
    });

    expect(readRecentPages()).toEqual([]);
  });

  it("ignores folder items", () => {
    recordRecentPage({
      id: "folder-1",
      title: "โฟลเดอร์",
      href: "/documents/folder-1",
      iconId: "folder",
    });

    expect(readRecentPages()).toEqual([]);
  });
});
