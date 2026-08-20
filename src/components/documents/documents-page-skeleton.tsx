import { Skeleton } from "@/components/ui/skeleton";
import {
  DOCUMENT_CARD_CAPTION_GAP,
  DOCUMENT_CARD_HEIGHT,
  DOCUMENT_CARD_PADDING,
  DOCUMENT_CARD_RADIUS,
  DOCUMENT_CARD_WIDTH,
  DOCUMENT_COLOR_FADE_HEIGHT,
  DOCUMENT_ICON_CLASS,
  FOLDER_BODY_OFFSET,
  FOLDER_BODY_RADIUS,
  FOLDER_CARD_WIDTH,
  FOLDER_TAB_HEIGHT,
  FOLDER_TAB_RADIUS,
  NEW_DOCUMENT_ICON_WRAP,
} from "@/components/documents/document-card-metrics";
import { cn } from "@/lib/utils";

function NewDocumentCardSkeleton() {
  return (
    <div className={cn("flex shrink-0 flex-col", DOCUMENT_CARD_WIDTH)}>
      <div
        className={cn(
          "relative flex flex-col items-center justify-center overflow-hidden border border-dashed border-border/80 bg-sidebar",
          DOCUMENT_CARD_PADDING,
          DOCUMENT_CARD_RADIUS,
          DOCUMENT_CARD_HEIGHT
        )}
      >
        <Skeleton className={cn(NEW_DOCUMENT_ICON_WRAP, "rounded-full")} />
      </div>
      <Skeleton className={cn(DOCUMENT_CARD_CAPTION_GAP, "h-3 w-12 rounded-md")} />
    </div>
  );
}

function DocumentPageCardSkeleton() {
  return (
    <div className={cn("flex shrink-0 flex-col", DOCUMENT_CARD_WIDTH)}>
      <div
        className={cn(
          "relative flex flex-col overflow-hidden border border-border bg-sidebar",
          DOCUMENT_CARD_PADDING,
          DOCUMENT_CARD_RADIUS,
          DOCUMENT_CARD_HEIGHT
        )}
      >
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-border/15 to-transparent",
            DOCUMENT_COLOR_FADE_HEIGHT
          )}
        />
        <Skeleton className={cn("relative mt-auto", DOCUMENT_ICON_CLASS, "rounded-md")} />
      </div>
      <div className={cn(DOCUMENT_CARD_CAPTION_GAP, "space-y-1")}>
        <Skeleton className="h-3 w-full rounded-md sm:h-3.5" />
        <Skeleton className="h-2.5 w-1/3 rounded-md" />
      </div>
    </div>
  );
}

function FolderCardSkeleton() {
  return (
    <div className={cn("flex shrink-0 flex-col", FOLDER_CARD_WIDTH)}>
      <div className={cn("relative block", FOLDER_CARD_WIDTH, DOCUMENT_CARD_HEIGHT)}>
        <Skeleton
          className={cn(
            "absolute left-0 top-0 z-0 w-[42%] border border-border/60 border-b-0",
            FOLDER_TAB_HEIGHT,
            FOLDER_TAB_RADIUS
          )}
        />
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 z-10 flex flex-col overflow-hidden border border-border bg-sidebar",
            FOLDER_BODY_OFFSET,
            DOCUMENT_CARD_PADDING,
            DOCUMENT_CARD_RADIUS,
            FOLDER_BODY_RADIUS
          )}
        >
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-border/15 to-transparent",
              DOCUMENT_CARD_RADIUS,
              FOLDER_BODY_RADIUS,
              DOCUMENT_COLOR_FADE_HEIGHT
            )}
          />
          <Skeleton className={cn("relative mt-auto", DOCUMENT_ICON_CLASS, "rounded-md")} />
        </div>
      </div>
      <div className={cn(DOCUMENT_CARD_CAPTION_GAP, "space-y-1")}>
        <Skeleton className="h-3 w-4/5 rounded-md sm:h-3.5" />
        <Skeleton className="h-2.5 w-1/3 rounded-md" />
      </div>
    </div>
  );
}

function DocumentSectionRowSkeleton() {
  return (
    <section aria-hidden>
      <div className="mb-2.5 flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded-sm" />
        <Skeleton className="h-4 w-28 rounded-md sm:h-5" />
      </div>
      <div className="flex gap-2 overflow-hidden pb-1">
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
      className={cn("space-y-7", className)}
      aria-busy="true"
      aria-label="กำลังโหลดเอกสาร"
    >
      <DocumentSectionRowSkeleton />
      <DocumentSectionRowSkeleton />
    </div>
  );
}
