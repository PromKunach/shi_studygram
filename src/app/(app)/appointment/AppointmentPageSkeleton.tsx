import { Skeleton } from "@/components/ui/skeleton";

export function AppointmentListSkeleton({ count = 2 }: { count?: number }) {
  return (
    <ul className="space-y-2" aria-busy="true" aria-label="กำลังโหลดรายการนัดหมาย">
      {Array.from({ length: count }).map((_, index) => (
        <li key={index}>
          <div className="rounded-xl border border-border bg-hover/50 px-4 py-3">
            <div className="flex items-start gap-3">
              <Skeleton className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2.5">
                <Skeleton className="h-1.5 w-full rounded-full" />
                <Skeleton className="h-4 w-3/5 rounded-md" />
                <Skeleton className="h-3 w-full rounded-md" />
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function AppointmentCalendarDotsSkeleton() {
  return (
    <>
      <Skeleton className="h-1 w-full rounded-full" />
      <Skeleton className="h-1 w-4/5 rounded-full" />
    </>
  );
}
