import { CalendarDays } from "lucide-react";

export function UpcomingEventsSection() {
  return (
    <section className="mt-10">
      <div className="mb-3 flex items-center gap-2 text-sm text-muted">
        <CalendarDays className="h-4 w-4" />
        Upcoming events
      </div>

      <div className="rounded-2xl border border-border bg-sidebar px-4 py-10 text-center sm:px-6 sm:py-14">
        <CalendarDays
          className="mx-auto mb-4 h-10 w-10 text-muted opacity-40"
          strokeWidth={1.5}
        />
        <p className="text-sm text-muted">
          No upcoming events in the next 7 days
        </p>
        <button
          type="button"
          className="mt-4 text-sm font-medium text-foreground hover:underline"
        >
          + New event
        </button>
      </div>
    </section>
  );
}
