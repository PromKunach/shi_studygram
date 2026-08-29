import { describe, expect, it } from "vitest";

import { buildDocumentSearchCatalog } from "@/lib/ai/document-search-core";
import {
  detectSearchIntent,
  inferSearchQuery,
  normalizeUserSearchQuery,
  resolveAiIntent,
} from "@/lib/ai/intent";
import { SEARCH_COMMAND_PREFIX } from "@/lib/ai/search-command";

const nodes = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    author_pbri_id: "user-1",
    parent_id: null,
    kind: "section" as const,
    title: "คณิตศาสตร์",
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

const catalog = buildDocumentSearchCatalog(nodes);

describe("ai intent", () => {
  it("still supports the /ค้นหา prefix", () => {
    expect(normalizeUserSearchQuery(`${SEARCH_COMMAND_PREFIX} คณิตศาสตร์`)).toBe(
      "คณิตศาสตร์"
    );
    expect(detectSearchIntent(`${SEARCH_COMMAND_PREFIX} คณิตศาสตร์`, catalog)).toBe(
      true
    );
  });

  it("detects document search without the prefix", () => {
    expect(detectSearchIntent("คณิตศาสตร์", catalog)).toBe(true);
    expect(detectSearchIntent("หาเอกสารคณิต", catalog)).toBe(true);
    expect(detectSearchIntent("เอกสารในวิชาคณิตศาสตร์", catalog)).toBe(true);
  });

  it("keeps explanatory questions in chat mode", () => {
    expect(detectSearchIntent("อธิบายวิธีท่องจำสูตร", catalog)).toBe(false);
    expect(detectSearchIntent("how do I use this app?", catalog)).toBe(false);
    expect(resolveAiIntent("สรุปบทเรียน", nodes)).toEqual({ mode: "chat" });
  });

  it("resolves search intent with normalized query", () => {
    expect(resolveAiIntent("หา คณิตศาสตร์", nodes)).toEqual({
      mode: "search",
      query: "คณิตศาสตร์",
      prompt: "คณิตศาสตร์",
    });
  });

  it("understands conversational document requests", () => {
    expect(detectSearchIntent("อยากดูแบบฝึกหัด", catalog)).toBe(true);
    expect(resolveAiIntent("ช่วยหาคณิตหน่อย", nodes)).toEqual({
      mode: "search",
      query: "คณิต",
      prompt: "ช่วยหาคณิตหน่อย",
    });
    expect(inferSearchQuery("ช่วยหาคณิตหน่อย")).toBe("คณิต");
  });

  it("treats document lookup with the word สรุป as search, not chat", () => {
    const prompt = 'เอกสารที่เกี่ยวข้องกับคณิตศาสตร์และคำว่า "สรุป"';

    expect(detectSearchIntent(prompt, catalog)).toBe(true);
    expect(resolveAiIntent(prompt, nodes)).toEqual({
      mode: "search",
      query: 'คณิตศาสตร์และคำว่า "สรุป"',
      prompt,
    });
  });

  it("answers search capability questions in chat mode", () => {
    const prompt =
      "ค้นหาเอกสารด้วยเนื้อหาในเอกสารแทนที่จะเป็นชื่อเอกสารหรือรายละเอียดเอกสารได้ไหม";

    expect(detectSearchIntent(prompt, catalog)).toBe(false);
    expect(resolveAiIntent(prompt, nodes)).toEqual({ mode: "chat" });
  });

  it("lists available documents in chat mode, not search", () => {
    expect(detectSearchIntent("หาเอกสารอะไรได้บ้าง", catalog)).toBe(false);
    expect(resolveAiIntent("หาเอกสารอะไรได้บ้าง", nodes)).toEqual({
      mode: "chat",
    });
    expect(detectSearchIntent("มีอะไรในคณิตบ้าง", catalog)).toBe(true);
  });
});
