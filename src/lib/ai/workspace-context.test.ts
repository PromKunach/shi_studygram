import { describe, expect, it } from "vitest";

import { getAiChatSystemPrompt } from "@/lib/ai/config";
import {
  buildAiWorkspaceContext,
  buildAppointmentAiContext,
} from "@/lib/ai/workspace-context";
import type { AppointmentRecord } from "@/lib/appointments";

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

const appointments: AppointmentRecord[] = [
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    title: "ส่งรายงานชีวะ",
    description: "ส่งก่อนเที่ยง",
    scheduled_date: "2026-08-30",
    tone: "red",
    tag_label: null,
    tag_color: null,
    series_id: null,
    author_pbri_id: "user-1",
    created_at: "2026-01-01T00:00:00.000Z",
  },
];

describe("ai workspace context", () => {
  it("builds workspace context from document nodes", () => {
    const context = buildAiWorkspaceContext(nodes);

    expect(context.app).toBe("Shi studygram");
    expect(context.pages).toHaveLength(1);
    expect(context.pages[0]?.title).toBe("แบบฝึกหัด");
    expect(context.sections[0]?.title).toBe("คณิตศาสตร์");
    expect(context.appointments.items).toEqual([]);
  });

  it("includes appointments in workspace context", () => {
    const context = buildAiWorkspaceContext(nodes, appointments);

    expect(context.appointments.items).toEqual([
      expect.objectContaining({
        title: "ส่งรายงานชีวะ",
        date: "2026-08-30",
        priority: "important",
        description: "ส่งก่อนเที่ยง",
      }),
    ]);
    expect(buildAppointmentAiContext(appointments).range).toEqual({
      start: "2026-08-30",
      end: "2026-08-30",
    });
  });

  it("pre-filters appointments when the user specifies a date constraint", () => {
    const items = [
      { title: "A", date: "2026-08-23" },
      { title: "B", date: "2026-08-27" },
      { title: "C", date: "2026-08-29" },
    ];
    const context = buildAiWorkspaceContext(nodes, [
      {
        id: "1",
        title: "A",
        description: "",
        scheduled_date: "2026-08-23",
        tone: "blue",
        tag_label: null,
        series_id: null,
      },
      {
        id: "2",
        title: "B",
        description: "",
        scheduled_date: "2026-08-27",
        tone: "red",
        tag_label: null,
        series_id: null,
      },
      {
        id: "3",
        title: "C",
        description: "",
        scheduled_date: "2026-08-29",
        tone: "blue",
        tag_label: null,
        series_id: null,
      },
    ] as AppointmentRecord[], {
      appointmentQuery: "มีนัดอะไรบ้าง ก่อนวันที่ 28 สิงหาคม",
      referenceDate: new Date(2026, 7, 29),
    });

    expect(context.appointments.queryFilter).toEqual({
      label: "before 2026-08-28",
      matchedCount: 2,
    });
    expect(context.appointments.items.map((item) => item.title)).toEqual([
      "A",
      "B",
    ]);
    expect(items.map((item) => item.title)).toEqual(["A", "B", "C"]);
  });

  it("scopes chat prompt to workspace data", () => {
    const prompt = getAiChatSystemPrompt(buildAiWorkspaceContext(nodes, appointments));

    expect(prompt).toContain("Shi studygram");
    expect(prompt).toContain("librarian");
    expect(prompt).toContain("แบบฝึกหัด");
    expect(prompt).toContain("ส่งรายงานชีวะ");
    expect(prompt).toContain("appointments");
  });
});
