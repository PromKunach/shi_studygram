"use client";

import { useRef } from "react";
import { ChevronRight, Clock } from "lucide-react";
import { RecentPageCard } from "@/components/recent-page-card";
import { useRecentPages } from "@/hooks/use-recent-pages";
import { resolveRecentPageDisplay } from "@/lib/navigation";

export function RecentlyVisitedRow() {
  const recentPages = useRecentPages();
  const pages = recentPages.map(resolveRecentPageDisplay);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollNext = () => {
    scrollRef.current?.scrollBy({ left: 180, behavior: "smooth" });
  };

  if (pages.length === 0) {
    return (
      <section>
        <div className="mb-3 flex items-center gap-2 text-sm text-muted">
          <Clock className="h-4 w-4" />
          Recently visited
        </div>
        <p className="text-sm text-muted">No pages visited yet</p>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-3 flex items-center gap-2 text-sm text-muted">
        <Clock className="h-4 w-4" />
        Recently visited
      </div>

      <div className="relative flex items-center gap-2">
        <div
          ref={scrollRef}
          className="flex min-w-0 flex-1 gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {pages.map((page, index) => (
            <RecentPageCard
              key={page.id}
              href={page.slug}
              title={page.title}
              icon={page.icon}
              visitedAt={page.visitedAt}
              highlighted={index === 0}
            />
          ))}
        </div>

        {pages.length > 2 && (
          <button
            type="button"
            onClick={scrollNext}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted transition-colors hover:bg-hover hover:text-foreground"
            aria-label="Scroll recently visited pages"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </section>
  );
}
