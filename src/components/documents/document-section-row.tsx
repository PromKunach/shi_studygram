"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, Folder } from "lucide-react";
import {
  DocumentCard,
  type DocumentItem,
} from "@/components/documents/document-card";
import { NewDocumentCard } from "@/components/documents/new-document-card";
import { DOCUMENT_ROW_GAP, DOCUMENT_SCROLL_STEP } from "@/components/documents/document-card-metrics";
import {
  hasDocumentDriveLink,
  type DocumentBreadcrumbSegment,
} from "@/lib/documents";
import { sortDocumentsWithFoldersFirst } from "@/lib/document-icons";
import { cn } from "@/lib/utils";

export type DocumentSection = {
  id: string;
  title: string;
  documents: DocumentItem[];
};

type DocumentSectionRowProps = {
  section: DocumentSection;
  documents: DocumentItem[];
  breadcrumb: DocumentBreadcrumbSegment[];
  activeParentId: string;
  onNavigateBreadcrumb: (index: number) => void;
  onNewDocument: (parentId: string) => void;
  onOpenFolder: (document: DocumentItem) => void;
  onOpenDriveDocument?: (document: DocumentItem) => void;
  onEditDocument: (document: DocumentItem) => void;
  onDeleteDocument: (document: DocumentItem) => void;
  isSaving?: boolean;
};

const FADE_RAMP_PX = 72;

function getFadeOpacity(scrollLeft: number, scrollWidth: number, clientWidth: number) {
  const maxScroll = scrollWidth - clientWidth;
  if (maxScroll <= 1) {
    return { start: 0, end: 0 };
  }

  const start = Math.min(1, scrollLeft / FADE_RAMP_PX);
  const end = Math.min(1, (maxScroll - scrollLeft) / FADE_RAMP_PX);

  return { start, end };
}

export function DocumentSectionRow({
  section,
  documents,
  breadcrumb,
  activeParentId,
  onNavigateBreadcrumb,
  onNewDocument,
  onOpenFolder,
  onOpenDriveDocument,
  onEditDocument,
  onDeleteDocument,
  isSaving = false,
}: DocumentSectionRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [fadeOpacity, setFadeOpacity] = useState({ start: 0, end: 0 });
  const sortedDocuments = useMemo(
    () => sortDocumentsWithFoldersFirst(documents),
    [documents]
  );
  const cardCount = sortedDocuments.length + 1;

  const updateFade = useCallback(() => {
    const el = scrollRef.current;
    if (!el) {
      setFadeOpacity({ start: 0, end: 0 });
      return;
    }

    setFadeOpacity(
      getFadeOpacity(el.scrollLeft, el.scrollWidth, el.clientWidth)
    );
  }, []);

  useEffect(() => {
    updateFade();
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener("scroll", updateFade, { passive: true });
    window.addEventListener("resize", updateFade);

    const observer = new ResizeObserver(updateFade);
    observer.observe(el);

    return () => {
      el.removeEventListener("scroll", updateFade);
      window.removeEventListener("resize", updateFade);
      observer.disconnect();
    };
  }, [sortedDocuments.length, updateFade]);

  const scrollNext = () => {
    scrollRef.current?.scrollBy({ left: DOCUMENT_SCROLL_STEP, behavior: "smooth" });
  };

  const handleOpen = (document: DocumentItem) => {
    if (document.type === "folder") {
      onOpenFolder(document);
      return;
    }

    if (hasDocumentDriveLink(document)) {
      onOpenDriveDocument?.(document);
    }
  };

  return (
    <section>
      <div className="mb-2.5 flex min-w-0 items-center gap-2 text-sm text-muted sm:text-base">
        <Folder className="h-4 w-4 shrink-0" />
        <nav
          className="flex min-w-0 flex-1 items-center gap-1"
          aria-label={`ตำแหน่งใน${section.title}`}
        >
          {breadcrumb.map((segment, index) => {
            const isLast = index === breadcrumb.length - 1;

            return (
              <span key={segment.id} className="flex min-w-0 items-center gap-1">
                {index > 0 && (
                  <ChevronRight
                    className="h-3.5 w-3.5 shrink-0 text-muted"
                    aria-hidden
                  />
                )}
                {isLast ? (
                  <span className="truncate font-semibold text-foreground">
                    {segment.title}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onNavigateBreadcrumb(index)}
                    className="truncate transition-colors hover:text-foreground"
                  >
                    {segment.title}
                  </button>
                )}
              </span>
            );
          })}
        </nav>
      </div>

      <div className="relative flex items-center gap-1.5">
        <div className="relative min-w-0 flex-1">
          <div
            ref={scrollRef}
            className={cn(
              "flex overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
              DOCUMENT_ROW_GAP
            )}
          >
            <NewDocumentCard onClick={() => onNewDocument(activeParentId)} />
            {sortedDocuments.map((document, index) => (
              <DocumentCard
                key={document.id}
                document={document}
                href={
                  document.type === "document" &&
                  !hasDocumentDriveLink(document)
                    ? `/documents/${document.id}`
                    : undefined
                }
                onOpen={
                  document.type === "folder" || hasDocumentDriveLink(document)
                    ? () => handleOpen(document)
                    : undefined
                }
                onEdit={() => onEditDocument(document)}
                onDelete={() => onDeleteDocument(document)}
                isBusy={isSaving}
                highlighted={index === 0}
              />
            ))}
          </div>

          <div
            aria-hidden
            style={{ opacity: fadeOpacity.start }}
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-background from-10% via-background/70 via-55% to-transparent"
          />

          <div
            aria-hidden
            style={{ opacity: fadeOpacity.end }}
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-background from-10% via-background/70 via-55% to-transparent"
          />
        </div>

        {cardCount > 2 && (
          <button
            type="button"
            onClick={scrollNext}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted shadow-sm transition-colors hover:bg-hover hover:text-foreground"
            aria-label="Scroll documents"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </section>
  );
}
