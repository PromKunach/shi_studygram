"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { RecentPageCard } from "@/components/recent-page-card";
import { useRecentPages } from "@/hooks/use-recent-pages";
import { resolveRecentPageDisplay } from "@/lib/navigation";
import { cn } from "@/lib/utils";

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

export function RecentlyVisitedRow() {
  const recentPages = useRecentPages();
  const pages = recentPages.map(resolveRecentPageDisplay);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState<ScrollState>({
    canScrollLeft: false,
    canScrollRight: false,
  });

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
  }, [pages.length, updateScrollState]);

  const scrollBy = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;

    const distance = Math.max(160, Math.round(el.clientWidth * 0.75));
    el.scrollBy({
      left: direction === "right" ? distance : -distance,
      behavior: "smooth",
    });
  };

  const scrollButtonClass =
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted transition-colors hover:bg-hover hover:text-foreground";

  if (pages.length === 0) {
    return (
      <section>
        <div className="mb-3 flex items-center gap-2 text-sm text-muted">
          <Clock className="h-4 w-4" />
          เอกสารล่าสุด
        </div>
        <div className="rounded-xl border border-dashed border-border bg-sidebar px-4 py-8 text-center">
          <p className="text-sm text-muted">ยังไม่มีเอกสารที่เปิดล่าสุด</p>
          <Link
            href="/documents"
            className="mt-3 inline-block text-sm font-medium text-foreground hover:underline"
          >
            ไปที่เอกสาร
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted">
          <Clock className="h-4 w-4" />
          เอกสารล่าสุด
        </div>
        <Link
          href="/documents"
          className="text-sm font-medium text-foreground transition-colors hover:text-muted"
        >
          ดูทั้งหมด
        </Link>
      </div>

      <div className="flex min-w-0 items-start gap-1.5">
        {scrollState.canScrollLeft ? (
          <button
            type="button"
            onClick={() => scrollBy("left")}
            className={cn(scrollButtonClass, "mt-[3.6rem] sm:mt-[4rem]")}
            aria-label="เลื่อนไปทางซ้าย"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        ) : null}

        <div
          ref={scrollRef}
          className="flex min-w-0 flex-1 gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {pages.map((page) => (
            <RecentPageCard
              key={`${page.id}-${page.href}`}
              href={page.slug}
              title={page.title}
              icon={page.icon}
              visitedAt={page.visitedAt}
              colorStyles={page.colorStyles}
            />
          ))}
        </div>

        {scrollState.canScrollRight ? (
          <button
            type="button"
            onClick={() => scrollBy("right")}
            className={cn(scrollButtonClass, "mt-[3.6rem] sm:mt-[4rem]")}
            aria-label="เลื่อนไปทางขวา"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </section>
  );
}
