import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  FileText,
  Folder,
  Home,
  Megaphone,
  Newspaper,
  Pin,
} from "lucide-react";
import { getDocumentColorStyles, type DocumentColorId } from "@/lib/document-colors";
import { getDocumentIcon, type DocumentIconId } from "@/lib/document-icons";
import {
  formatRecentVisitedAt,
  readRecentPages,
  type RecentPageRecord,
} from "@/lib/recent-pages";

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

export const RECENT_SECTION_LABEL = "เอกสารล่าสุด";

/** Display metadata for a content page at a given URL slug. */
export const PAGE_META: Record<string, { label: string; icon: LucideIcon }> = {
  "/": { label: "หน้าหลัก", icon: Home },
  "/news": { label: "อัพเดตงาน", icon: Newspaper },
  "/announces": { label: "โน้ตประกาศ", icon: Megaphone },
  "/announces/feed": { label: "ฟีดบอร์ด", icon: Megaphone },
  "/appointment": { label: "กำหนดการณ์", icon: CalendarDays },
  "/documents": { label: "เอกสาร", icon: Folder },
};

export function getPageMeta(slug: string) {
  return PAGE_META[slug.trim()];
}

export function resolveRecentPageDisplay(page: RecentPageRecord) {
  const routeMeta = getPageMeta(page.href);
  const icon: LucideIcon = page.iconId
    ? getDocumentIcon(page.iconId as DocumentIconId)
    : routeMeta?.icon ?? FileText;

  return {
    id: page.id,
    title: page.title,
    href: page.href,
    slug: page.href,
    visitedAt: formatRecentVisitedAt(page.visitedAt),
    icon,
    colorId: page.colorId as DocumentColorId | undefined,
    colorStyles: getDocumentColorStyles(
      (page.colorId as DocumentColorId | undefined) ?? "none"
    ),
  };
}

export function getRecentlyVisitedPages() {
  return readRecentPages().map(resolveRecentPageDisplay);
}

export const NAV_TOP: NavItem[] = [
  { label: "หน้าหลัก", icon: Home, href: "/" },
  { label: "เอกสาร", icon: Folder, href: "/documents" },
  { label: "อัพเดตงาน", icon: Newspaper, href: "/news" },

  { label: "บอร์ด", icon: Pin, href: "/announces" },

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
