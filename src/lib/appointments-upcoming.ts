type AppointmentSeriesItem = {
  id: string;
  series_id: string | null;
};

function toScheduledDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getUpcomingDateRange(days = 7, today = new Date()) {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + days - 1);
  const endExclusive = new Date(end);
  endExclusive.setDate(endExclusive.getDate() + 1);

  return {
    start: toScheduledDate(start),
    endExclusive: toScheduledDate(endExclusive),
  };
}

export function formatUpcomingRelativeDay(date: Date, today = new Date()) {
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.round(
    (target.getTime() - todayStart.getTime()) / 86_400_000
  );

  if (dayDiff === 0) return "วันนี้";
  if (dayDiff === 1) return "พรุ่งนี้";

  return target.toLocaleDateString("th-TH", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function collapseAppointmentSeries<T extends AppointmentSeriesItem>(
  appointments: T[]
) {
  const seenSeries = new Set<string>();

  return appointments.filter((item) => {
    if (!item.series_id) return true;
    if (seenSeries.has(item.series_id)) return false;
    seenSeries.add(item.series_id);
    return true;
  });
}
