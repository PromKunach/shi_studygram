import type { AiAppointmentContextEntry } from "@/lib/ai/workspace-context";

export type AppointmentDateFilter = {
  label: string;
  before?: string;
  onOrBefore?: string;
  after?: string;
  onOrAfter?: string;
  on?: string;
  month?: { year: number; month: number };
};

const THAI_MONTHS: Record<string, number> = {
  มกราคม: 1,
  "ม.ค.": 1,
  มค: 1,
  กุมภาพันธ์: 2,
  "ก.พ.": 2,
  กพ: 2,
  มีนาคม: 3,
  "มี.ค.": 3,
  มีค: 3,
  เมษายน: 4,
  "เม.ย.": 4,
  เมย: 4,
  พฤษภาคม: 5,
  "พ.ค.": 5,
  พค: 5,
  มิถุนายน: 6,
  "มิ.ย.": 6,
  มิย: 6,
  กรกฎาคม: 7,
  "ก.ค.": 7,
  กค: 7,
  สิงหาคม: 8,
  "ส.ค.": 8,
  สค: 8,
  กันยายน: 9,
  "ก.ย.": 9,
  กย: 9,
  ตุลาคม: 10,
  "ต.ค.": 10,
  ตค: 10,
  พฤศจิกายน: 11,
  "พ.ย.": 11,
  พย: 11,
  ธันวาคม: 12,
  "ธ.ค.": 12,
  ธค: 12,
};

const ENGLISH_MONTHS: Record<string, number> = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sep: 9,
  sept: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
};

function padDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function inferYear(month: number, referenceDate: Date) {
  const referenceYear = referenceDate.getFullYear();
  const referenceMonth = referenceDate.getMonth() + 1;

  if (month > referenceMonth + 6) {
    return referenceYear - 1;
  }

  if (month < referenceMonth - 6) {
    return referenceYear + 1;
  }

  return referenceYear;
}

function parseMonthToken(token: string) {
  const normalized = token.trim().toLowerCase().replace(/\./g, "");
  return THAI_MONTHS[token.trim()] ?? THAI_MONTHS[normalized] ?? ENGLISH_MONTHS[normalized];
}

function parseDayMonth(
  dayText: string,
  monthText: string,
  yearText: string | undefined,
  referenceDate: Date
) {
  const day = Number(dayText);
  const month = parseMonthToken(monthText);
  if (!day || !month) return null;

  const year = yearText ? Number(yearText) : inferYear(month, referenceDate);
  if (!year) return null;

  return padDate(year, month, day);
}

function matchDayMonth(query: string, referenceDate: Date) {
  const thaiMatch = query.match(
    /(?:วันที่)?\s*(\d{1,2})\s*([^\d\s?，,]+)(?:\s*(?:พ\.?\s*ศ\.?|ค\.?\s*ศ\.?|ปี)?\s*(\d{4}))?/
  );
  if (!thaiMatch) return null;

  return parseDayMonth(
    thaiMatch[1],
    thaiMatch[2].trim(),
    thaiMatch[3],
    referenceDate
  );
}

function matchConstrainedDayMonth(
  query: string,
  constraint: "before" | "onOrBefore" | "after",
  referenceDate: Date
) {
  const patterns = {
    before:
      /(?:ก่อน(?:วันที่)?|before)\s*(?:วันที่)?\s*(\d{1,2})\s*([^\d\s?，,]+)(?:\s*(?:พ\.?\s*ศ\.?|ค\.?\s*ศ\.?|ปี)?\s*(\d{4}))?/i,
    onOrBefore:
      /(?:ภายใน|ไม่เกิน|on or before|by)\s*(?:วันที่)?\s*(\d{1,2})\s*([^\d\s?，,]+)(?:\s*(?:พ\.?\s*ศ\.?|ค\.?\s*ศ\.?|ปี)?\s*(\d{4}))?/i,
    after:
      /(?:หลัง(?:วันที่)?|after|since)\s*(?:วันที่)?\s*(\d{1,2})\s*([^\d\s?，,]+)(?:\s*(?:พ\.?\s*ศ\.?|ค\.?\s*ศ\.?|ปี)?\s*(\d{4}))?/i,
  };

  const match = query.match(patterns[constraint]);
  if (!match) return null;

  return parseDayMonth(match[1], match[2].trim(), match[3], referenceDate);
}

function compareDates(left: string, right: string) {
  return left.localeCompare(right);
}

function appointmentStartDate(entry: AiAppointmentContextEntry) {
  return entry.date;
}

function appointmentOverlapsOn(entry: AiAppointmentContextEntry, date: string) {
  const endDate = entry.endDate ?? entry.date;
  return compareDates(entry.date, date) <= 0 && compareDates(endDate, date) >= 0;
}

export function parseAppointmentDateFilter(
  query: string,
  referenceDate = new Date()
) {
  const normalized = query.trim();
  if (!normalized) return null;

  const beforeDate = matchConstrainedDayMonth(normalized, "before", referenceDate);
  if (beforeDate) {
    return {
      label: `before ${beforeDate}`,
      before: beforeDate,
    } satisfies AppointmentDateFilter;
  }

  const onOrBeforeDate = matchConstrainedDayMonth(
    normalized,
    "onOrBefore",
    referenceDate
  );
  if (onOrBeforeDate) {
    return {
      label: `on or before ${onOrBeforeDate}`,
      onOrBefore: onOrBeforeDate,
    } satisfies AppointmentDateFilter;
  }

  const afterDate = matchConstrainedDayMonth(normalized, "after", referenceDate);
  if (afterDate) {
    return {
      label: `after ${afterDate}`,
      after: afterDate,
    } satisfies AppointmentDateFilter;
  }

  const isoMatch = normalized.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (isoMatch) {
    const date = isoMatch[1];
    if (/(?:ก่อน|before)\b/i.test(normalized)) {
      return { label: `before ${date}`, before: date };
    }
    if (/(?:หลัง|after|since)\b/i.test(normalized)) {
      return { label: `after ${date}`, after: date };
    }
    if (/(?:ภายใน|ไม่เกิน|by|on or before)\b/i.test(normalized)) {
      return { label: `on or before ${date}`, onOrBefore: date };
    }
    if (/(?:วันที่|on)\b/i.test(normalized)) {
      return { label: `on ${date}`, on: date };
    }
  }

  const dayMonth = matchDayMonth(normalized, referenceDate);
  if (dayMonth && /(?:วันที่|on)\b/i.test(normalized)) {
    return { label: `on ${dayMonth}`, on: dayMonth };
  }

  const monthOnlyMatch = normalized.match(
    /(?:เดือน|in)\s*([^\d\s?，,]+)(?:\s*(?:พ\.?\s*ศ\.?|ค\.?\s*ศ\.?|ปี)?\s*(\d{4}))?/i
  );
  if (monthOnlyMatch) {
    const month = parseMonthToken(monthOnlyMatch[1].trim());
    if (month) {
      const year = monthOnlyMatch[2]
        ? Number(monthOnlyMatch[2])
        : inferYear(month, referenceDate);
      return {
        label: `month ${year}-${String(month).padStart(2, "0")}`,
        month: { year, month },
      } satisfies AppointmentDateFilter;
    }
  }

  return null;
}

export function filterAppointmentContextEntries(
  entries: AiAppointmentContextEntry[],
  filter: AppointmentDateFilter | null
) {
  if (!filter) return entries;

  return entries.filter((entry) => {
    const startDate = appointmentStartDate(entry);

    if (filter.before && compareDates(startDate, filter.before) >= 0) {
      return false;
    }

    if (filter.onOrBefore && compareDates(startDate, filter.onOrBefore) > 0) {
      return false;
    }

    if (filter.after && compareDates(startDate, filter.after) <= 0) {
      return false;
    }

    if (filter.onOrAfter && compareDates(startDate, filter.onOrAfter) < 0) {
      return false;
    }

    if (filter.on && !appointmentOverlapsOn(entry, filter.on)) {
      return false;
    }

    if (filter.month) {
      const [year, month] = startDate.split("-").map(Number);
      if (year !== filter.month.year || month !== filter.month.month) {
        return false;
      }
    }

    return true;
  });
}
