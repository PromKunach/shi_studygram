import { describe, expect, it } from "vitest";

import {
  filterAppointmentContextEntries,
  parseAppointmentDateFilter,
} from "@/lib/ai/appointment-query";
import type { AiAppointmentContextEntry } from "@/lib/ai/workspace-context";

const referenceDate = new Date(2026, 7, 29);

const entries: AiAppointmentContextEntry[] = [
  {
    title: "กิจกรรมชมรม",
    date: "2026-08-23",
    description: "อบรมพิเศษ",
  },
  {
    title: "งานไหว้ครู",
    date: "2026-08-27",
    description: "จัดที่ สบช.",
    priority: "important",
  },
  {
    title: "ประชุมปลอมๆ",
    date: "2026-08-29",
    tag: "ทั่วไป",
    priority: "normal",
  },
];

describe("appointment date query", () => {
  it("parses Thai before-date filters", () => {
    expect(
      parseAppointmentDateFilter(
        "มีนัดอะไรบ้าง ก่อนวันที่ 28 สิงหาคม",
        referenceDate
      )
    ).toEqual({
      label: "before 2026-08-28",
      before: "2026-08-28",
    });
  });

  it("filters appointments before a date using start date only", () => {
    const filter = parseAppointmentDateFilter(
      "มีนัดอะไรบ้าง ก่อนวันที่ 28 สิงหาคม",
      referenceDate
    );

    expect(filterAppointmentContextEntries(entries, filter)).toEqual([
      entries[0],
      entries[1],
    ]);
  });

  it("parses on-or-before filters", () => {
    const filter = parseAppointmentDateFilter(
      "มีนัดอะไรภายใน 28 สิงหาคม",
      referenceDate
    );

    expect(filter).toEqual({
      label: "on or before 2026-08-28",
      onOrBefore: "2026-08-28",
    });
    expect(filterAppointmentContextEntries(entries, filter)).toEqual([
      entries[0],
      entries[1],
    ]);
  });

  it("parses after-date filters", () => {
    const filter = parseAppointmentDateFilter(
      "มีนัดอะไรหลังวันที่ 27 สิงหาคม",
      referenceDate
    );

    expect(filterAppointmentContextEntries(entries, filter)).toEqual([entries[2]]);
  });
});
