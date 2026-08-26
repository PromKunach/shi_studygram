import { describe, expect, it } from "vitest";
import {
  collapseAppointmentSeries,
  formatUpcomingRelativeDay,
  getUpcomingDateRange,
} from "./appointments-upcoming";

function appointment(partial: {
  id: string;
  series_id?: string | null;
  scheduled_date?: string;
}) {
  return {
    id: partial.id,
    series_id: partial.series_id ?? null,
    scheduled_date: partial.scheduled_date ?? "2026-08-26",
  };
}

describe("upcoming appointments", () => {
  it("builds a 7-day inclusive date range", () => {
    const today = new Date(2026, 7, 26);
    expect(getUpcomingDateRange(7, today)).toEqual({
      start: "2026-08-26",
      endExclusive: "2026-09-02",
    });
  });

  it("formats relative day labels in Thai", () => {
    const today = new Date(2026, 7, 26);
    expect(formatUpcomingRelativeDay(new Date(2026, 7, 26), today)).toBe("วันนี้");
    expect(formatUpcomingRelativeDay(new Date(2026, 7, 27), today)).toBe("พรุ่งนี้");
    expect(formatUpcomingRelativeDay(new Date(2026, 7, 28), today)).toContain("28");
  });

  it("collapses multi-day series to one row", () => {
    const items = [
      appointment({ id: "a", series_id: "series-1", scheduled_date: "2026-08-26" }),
      appointment({ id: "b", series_id: "series-1", scheduled_date: "2026-08-27" }),
      appointment({ id: "c", scheduled_date: "2026-08-28" }),
    ];

    expect(collapseAppointmentSeries(items).map((item) => item.id)).toEqual([
      "a",
      "c",
    ]);
  });
});
