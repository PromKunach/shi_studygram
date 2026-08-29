export type AppointmentTone = "red" | "blue" | "neutral";

export type AppointmentSeriesRecord = {
  id: string;
  title: string;
  description: string;
  scheduled_date: string;
  tone: AppointmentTone;
  tag_label: string | null;
  series_id: string | null;
};

const BOARD_SOURCE_PATTERN = /\s*\(มาจากบอร์ด:\s*(.+?)\)\s*$/;

export function parseBoardSourceFromText(text: string) {
  const match = text.match(BOARD_SOURCE_PATTERN);
  if (!match) return { body: text, boardLabel: null };

  const body = text.slice(0, match.index ?? 0).trimEnd();
  return { body, boardLabel: match[1].trim() };
}

export function appendBoardSourceToText(text: string, boardLabel: string) {
  const { body } = parseBoardSourceFromText(text);
  const label = boardLabel.trim() || "บอร์ด";
  const suffix = `(มาจากบอร์ด: ${label})`;
  const trimmed = body.trim();
  if (!trimmed) return suffix;
  return `${trimmed} ${suffix}`;
}

export function appointmentDescriptionDisplay(description: string) {
  const trimmed = description.trim();
  return trimmed || null;
}

export function appointmentTitleDisplay(title: string) {
  return parseBoardSourceFromText(title).body.trim() || "ไม่มีชื่อ";
}

export function appointmentTagLabel(record: Pick<AppointmentSeriesRecord, "tag_label" | "tone">) {
  if (record.tag_label) return record.tag_label;
  if (record.tone === "red") return "สำคัญ";
  if (record.tone === "blue") return "ทั่วไป";
  return null;
}

export function getSeriesMembers<T extends AppointmentSeriesRecord>(
  appointment: T,
  appointments: T[]
) {
  if (!appointment.series_id) return [appointment];

  return appointments
    .filter((item) => item.series_id === appointment.series_id)
    .sort((left, right) => left.scheduled_date.localeCompare(right.scheduled_date));
}

export function boardSourceLabelFromRecord(
  record: Pick<AppointmentSeriesRecord, "title" | "description">
) {
  return (
    parseBoardSourceFromText(record.title).boardLabel ??
    parseBoardSourceFromText(record.description).boardLabel
  );
}

export function isBoardSourcedAppointment(
  record: Pick<AppointmentSeriesRecord, "title" | "description">
) {
  return Boolean(boardSourceLabelFromRecord(record));
}
