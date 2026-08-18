"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, Folder } from "lucide-react";
import {
  DocumentCard,
  type DocumentItem,
} from "@/components/documents/document-card";
import { NewDocumentCard } from "@/components/documents/new-document-card";
import { sortDocumentsWithFoldersFirst } from "@/lib/document-icons";

export type DocumentSection = {
  id: string;
  title: string;
  documents: DocumentItem[];
};

type DocumentSectionRowProps = {
  section: DocumentSection;
  onNewDocument: (sectionId: string) => void;
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
  onNewDocument,
}: DocumentSectionRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [fadeOpacity, setFadeOpacity] = useState({ start: 0, end: 0 });
  const sortedDocuments = useMemo(
    () => sortDocumentsWithFoldersFirst(section.documents),
    [section.documents]
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
    scrollRef.current?.scrollBy({ left: 180, behavior: "smooth" });
  };

  return (
    <section>
      <div className="mb-3 flex items-center gap-2 text-sm text-muted">
        <Folder className="h-4 w-4 shrink-0" />
        <span className="truncate font-medium text-foreground">{section.title}</span>
      </div>

      <div className="relative flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <NewDocumentCard onClick={() => onNewDocument(section.id)} />
            {sortedDocuments.map((document, index) => (
              <DocumentCard
                key={document.id}
                document={document}
                href={`/documents/${document.id}?section=${encodeURIComponent(section.title)}`}
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
