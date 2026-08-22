"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getPageMeta } from "@/lib/navigation";
import { recordRecentPage } from "@/lib/recent-pages";

const DOCUMENT_PAGE_PATTERN = /^\/documents\/([^/]+)$/;

export function RecentPageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname === "/") return;

    if (pathname === "/documents") return;

    if (DOCUMENT_PAGE_PATTERN.test(pathname)) return;

    const meta = getPageMeta(pathname);
    if (!meta) return;

    recordRecentPage({
      id: pathname,
      title: meta.label,
      href: pathname,
    });
  }, [pathname]);

  return null;
}
