import { describe, expect, it } from "vitest";

import { getAiChatSystemPrompt } from "@/lib/ai/config";
import { buildAiWorkspaceContext } from "@/lib/ai/workspace-context";

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
    description: "ทดสอบ",
    content: "",
    drive_url: "",
    icon: "page",
    color: "blue",
    position: 0,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
];

describe("ai workspace context", () => {
  it("builds workspace context from document nodes", () => {
    const context = buildAiWorkspaceContext(nodes);

    expect(context.app).toBe("Shi studygram");
    expect(context.pages).toHaveLength(1);
    expect(context.pages[0]?.title).toBe("แบบฝึกหัด");
    expect(context.sections[0]?.title).toBe("คณิตศาสตร์");
  });

  it("scopes chat prompt to workspace data", () => {
    const prompt = getAiChatSystemPrompt(buildAiWorkspaceContext(nodes));

    expect(prompt).toContain("Shi studygram");
    expect(prompt).toContain("librarian");
    expect(prompt).toContain("แบบฝึกหัด");
  });
});
