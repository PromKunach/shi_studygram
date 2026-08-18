import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const DOCUMENT_CARD_WIDTH = "w-36 sm:w-40";
const DOCUMENT_CARD_HEIGHT = "h-[calc(9rem*5/4)] sm:h-[calc(10rem*5/4)]";

function NewDocumentCardSkeleton() {
  return (
    <div
      className={cn(
        "relative flex shrink-0 flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border/80 bg-sidebar p-4",
        DOCUMENT_CARD_WIDTH,
        DOCUMENT_CARD_HEIGHT
      )}
    >
      <Skeleton className="h-10 w-10 rounded-full" />
      <Skeleton className="mt-4 h-3.5 w-16 rounded-md" />
    </div>
  );
}

function DocumentPageCardSkeleton() {
  return (
    <div
      className={cn(
        "relative flex shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-sidebar p-4",
        DOCUMENT_CARD_WIDTH,
        DOCUMENT_CARD_HEIGHT
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-border/15 to-transparent"
      />
      <div className="relative mt-auto min-w-0">
        <Skeleton className="mb-2.5 h-8 w-8 rounded-md sm:h-9 sm:w-9" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-4/5 rounded-md" />
          <Skeleton className="h-3 w-1/3 rounded-md" />
        </div>
      </div>
    </div>
  );
}

function FolderCardSkeleton() {
  return (
    <div className={cn("relative block shrink-0", "w-60 sm:w-64", DOCUMENT_CARD_HEIGHT)}>
      <Skeleton className="absolute left-0 top-0 z-0 h-6 w-[42%] rounded-t-[14px] border border-border/60 border-b-0" />
      <div className="absolute inset-x-0 bottom-0 top-4 z-10 flex flex-col overflow-hidden rounded-2xl rounded-tl-md border border-border bg-sidebar p-4">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-20 rounded-t-2xl rounded-tl-md bg-gradient-to-b from-border/15 to-transparent"
        />
        <div className="relative mt-auto min-w-0">
          <Skeleton className="mb-2.5 h-8 w-8 rounded-md sm:h-9 sm:w-9" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-4/5 rounded-md" />
            <Skeleton className="h-3 w-1/3 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentSectionRowSkeleton() {
  return (
    <section aria-hidden>
      <div className="mb-3 flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded-sm" />
        <Skeleton className="h-4 w-28 rounded-md" />
      </div>
      <div className="flex gap-3 overflow-hidden pb-1">
        <NewDocumentCardSkeleton />
        <FolderCardSkeleton />
        <DocumentPageCardSkeleton />
        <DocumentPageCardSkeleton />
      </div>
    </section>
  );
}

export function DocumentsSectionsSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn("space-y-10", className)}
      aria-busy="true"
      aria-label="กำลังโหลดเอกสาร"
    >
      <DocumentSectionRowSkeleton />
      <DocumentSectionRowSkeleton />
    </div>
  );
}
