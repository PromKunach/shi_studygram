"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, ChevronRight, Plus } from "lucide-react";
import { getAppointmentAccentColor } from "@/app/(app)/appointment/appointment-ui";
import {
  appointmentDescriptionDisplay,
  appointmentLoadErrorMessage,
  appointmentTagLabel,
  appointmentTitleDisplay,
  fetchUpcomingAppointments,
  formatUpcomingRelativeDay,
  parseScheduledDate,
  type AppointmentRecord,
} from "@/lib/appointments";
import { cn } from "@/lib/utils";

const UPCOMING_LIMIT = 6;

function UpcomingEventSkeleton() {
  return (
    <div className="space-y-2" aria-hidden>
      {Array.from({ length: 2 }).map((_, index) => (
        <div
          key={index}
          className="h-[4.5rem] animate-pulse rounded-xl border border-border bg-sidebar"
        />
      ))}
    </div>
  );
}

function appointmentCardBackground(accent: string) {
  return `color-mix(in srgb, ${accent} 11%, var(--sidebar))`;
}

function UpcomingEventItem({ item }: { item: AppointmentRecord }) {
  const accent = getAppointmentAccentColor(item);
  const date = parseScheduledDate(item.scheduled_date);
  const dateLabel = formatUpcomingRelativeDay(date);
  const description = appointmentDescriptionDisplay(item.description);
  const tag = appointmentTagLabel(item);
  const dateParam = item.scheduled_date.slice(0, 10);
  const isSoon =
    dateLabel === "วันนี้" || dateLabel === "พรุ่งนี้";

  return (
    <li>
      <Link
        href={`/appointment?date=${dateParam}`}
        className="relative flex items-start gap-3 overflow-hidden rounded-xl border border-border px-4 py-3 transition-[filter] hover:brightness-[0.98] dark:hover:brightness-110"
        style={{ backgroundColor: appointmentCardBackground(accent) }}
      >
        <span
          className="absolute inset-x-0 top-0 h-1"
          style={{ backgroundColor: accent }}
          aria-hidden
        />

        <span
          className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: accent }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "text-xs font-medium",
                isSoon ? "text-foreground" : "text-muted"
              )}
              style={isSoon ? { color: accent } : undefined}
            >
              {dateLabel}
            </span>
            {tag ? (
              <span
                className="inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium"
                style={{
                  borderColor: accent,
                  color: accent,
                  backgroundColor: `color-mix(in srgb, ${accent} 12%, transparent)`,
                }}
              >
                {tag}
              </span>
            ) : null}
          </div>
          <div
            className="mb-2 h-1 w-full max-w-[4.5rem] rounded-full"
            style={{ backgroundColor: accent, opacity: 0.85 }}
            aria-hidden
          />
          <p className="truncate text-sm font-medium text-foreground">
            {appointmentTitleDisplay(item.title)}
          </p>
          {description ? (
            <p className="mt-0.5 line-clamp-1 text-sm text-muted">{description}</p>
          ) : null}
        </div>
        <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-muted" aria-hidden />
      </Link>
    </li>
  );
}

export function UpcomingEventsSection() {
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const records = await fetchUpcomingAppointments(7);
        if (!cancelled) setAppointments(records);
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setAppointments([]);
          setLoadError(appointmentLoadErrorMessage(error));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleAppointments = appointments.slice(0, UPCOMING_LIMIT);

  return (
    <section className="mt-10">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted">
          <CalendarDays className="h-4 w-4" />
          นัดหมาย 7 วันข้างหน้า
        </div>
        <Link
          href="/appointment"
          className="text-sm font-medium text-foreground transition-colors hover:text-muted"
        >
          ดูทั้งหมด
        </Link>
      </div>

      {loadError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {loadError}
        </div>
      ) : isLoading ? (
        <UpcomingEventSkeleton />
      ) : visibleAppointments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-sidebar px-4 py-10 text-center sm:px-6">
          <CalendarDays
            className="mx-auto mb-3 h-9 w-9 text-muted opacity-50"
            strokeWidth={1.5}
          />
          <p className="text-sm text-muted">ไม่มีนัดหมายใน 7 วันข้างหน้า</p>
          <Link
            href="/appointment?add=1"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:underline"
          >
            <Plus className="h-4 w-4" />
            เพิ่มนัดหมาย
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <ul className="space-y-2">
            {visibleAppointments.map((item) => (
              <UpcomingEventItem key={item.id} item={item} />
            ))}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-3">
            {appointments.length > UPCOMING_LIMIT ? (
              <p className="text-xs text-muted">
                แสดง {UPCOMING_LIMIT} จาก {appointments.length} รายการ
              </p>
            ) : (
              <span />
            )}
            <Link
              href="/appointment?add=1"
              className={cn(
                "inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:underline"
              )}
            >
              <Plus className="h-4 w-4" />
              เพิ่มนัดหมาย
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
