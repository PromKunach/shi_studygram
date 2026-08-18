import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  Folder,
  Home,
} from "lucide-react";

// ---------------------------------------------
// Config — edit this to reshape the nav
// ---------------------------------------------

export type NavSubItem = {
  label: string;
  href: string;
  /** Opens in a new tab. External URLs (http/https) do this automatically. */
  openInNewTab?: boolean;
};

export type NavItem = {
  label: string;
  icon: LucideIcon;
  href: string;
  expandable?: boolean;
  children?: NavSubItem[];
};

export type NavSection = {
  title?: string;
  items: NavItem[];
};

/** User-created content the user can open — not a Next.js `page.tsx` route file. */
export type ContentPageRef = {
  id: string;
  title: string;
  slug: string;
  visitedAt?: string;
};

/** Recently visited content pages — replace with real history later (e.g. Supabase). */
export const RECENTLY_VISITED: ContentPageRef[] = [
  { id: "english", title: "English", slug: "/announces", visitedAt: "Jul 9" },
  { id: "announces", title: "เอกสาร", slug: "/announces", visitedAt: "Jul 9" },
  {
    id: "appointment",
    title: "กำหนดการณ์",
    slug: "/appointment",
    visitedAt: "Jul 3",
  },
];

/** @deprecated Use RECENTLY_VISITED — kept for sidebar Recent dropdown. */
export const RECENT_PAGES = RECENTLY_VISITED.map((page) => ({
  label: page.title,
  href: page.slug,
}));

export const RECENT_SECTION_LABEL = "Recent";

/** Display metadata for a content page at a given URL slug. */
export const PAGE_META: Record<string, { label: string; icon: LucideIcon }> = {
  "/": { label: "หน้าหลัก", icon: Home },
  "/appointment": { label: "กำหนดการณ์", icon: CalendarDays },
  "/documents": { label: "เอกสาร", icon: Folder },
};

export function getPageMeta(slug: string) {
  return PAGE_META[slug.trim()];
}

export function getRecentlyVisitedPages() {
  return RECENTLY_VISITED.map((page) => {
    const meta = getPageMeta(page.slug);
    return {
      ...page,
      icon: meta?.icon ?? Home,
    };
  });
}

export const NAV_TOP: NavItem[] = [
  { label: "หน้าหลัก", icon: Home, href: "/" },
  { label: "เอกสาร", icon: Folder, href: "/documents" },
  { label: "กำหนดการณ์", icon: CalendarDays, href: "/appointment" },
];

export const NAV_OTHER: NavItem[] = [
 
];

export const NAV_SECTIONS: NavSection[] = [
  { items: NAV_TOP },
  { title: "อื่นๆ", items: NAV_OTHER },
];

export function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href.trim());
}

export function isExactNavMatch(pathname: string, href: string) {
  return pathname === href.trim();
}

export function isNavHrefActive(pathname: string, href: string) {
  const trimmedHref = href.trim();
  if (trimmedHref === "/") return pathname === "/";
  return pathname === trimmedHref || pathname.startsWith(`${trimmedHref}/`);
}

export function isNavItemActive(pathname: string, item: NavItem) {
  if (item.children?.length) {
    return item.children.some((child) => isExactNavMatch(pathname, child.href));
  }
  return isNavHrefActive(pathname, item.href);
}
