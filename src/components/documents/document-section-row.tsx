"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Folder } from "lucide-react";
import {
  DocumentCard,
  type DocumentItem,
} from "@/components/documents/document-card";
import { NewDocumentCard } from "@/components/documents/new-document-card";
import { DOCUMENT_ROW_GAP } from "@/components/documents/document-card-metrics";
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

type ScrollState = {
  canScrollLeft: boolean;
  canScrollRight: boolean;
};

function getScrollState(element: HTMLDivElement): ScrollState {
  const maxScroll = element.scrollWidth - element.clientWidth;
  if (maxScroll <= 1) {
    return { canScrollLeft: false, canScrollRight: false };
  }

  return {
    canScrollLeft: element.scrollLeft > 1,
    canScrollRight: element.scrollLeft < maxScroll - 1,
  };
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
  const [scrollState, setScrollState] = useState<ScrollState>({
    canScrollLeft: false,
    canScrollRight: false,
  });
  const sortedDocuments = useMemo(
    () => sortDocumentsWithFoldersFirst(documents),
    [documents]
  );

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) {
      setScrollState({ canScrollLeft: false, canScrollRight: false });
      return;
    }

    setScrollState(getScrollState(el));
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
      observer.disconnect();
    };
  }, [sortedDocuments.length, updateScrollState]);

  const scrollBy = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;

    const distance = Math.max(120, Math.round(el.clientWidth * 0.75));
    el.scrollBy({
      left: direction === "right" ? distance : -distance,
      behavior: "smooth",
    });
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

  const scrollButtonClass =
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted transition-colors hover:bg-hover hover:text-foreground";

  return (
    <section>
      <div className="mb-2 flex min-w-0 items-center gap-2 text-sm text-muted">
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
                  <span className="truncate font-medium text-foreground">
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

      <div className="flex min-w-0 items-start gap-1.5">
        {scrollState.canScrollLeft ? (
          <button
            type="button"
            onClick={() => scrollBy("left")}
            className={cn(scrollButtonClass, "mt-[3.6rem] sm:mt-[4rem]")}
            aria-label="เลื่อนเอกสารไปทางซ้าย"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        ) : null}

        <div
          ref={scrollRef}
          className={cn(
            "min-w-0 flex-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            "flex",
            DOCUMENT_ROW_GAP
          )}
        >
          <NewDocumentCard onClick={() => onNewDocument(activeParentId)} />
          {sortedDocuments.map((document) => (
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
            />
          ))}
        </div>

        {scrollState.canScrollRight ? (
          <button
            type="button"
            onClick={() => scrollBy("right")}
            className={cn(scrollButtonClass, "mt-[3.6rem] sm:mt-[4rem]")}
            aria-label="เลื่อนเอกสารไปทางขวา"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </section>
  );
}
