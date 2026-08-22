export type RecentPageRecord = {
  id: string;
  title: string;
  href: string;
  visitedAt: string;
  iconId?: string;
};

export const EMPTY_RECENT_PAGES: RecentPageRecord[] = [];

const STORAGE_KEY = "shistudygram:recent-pages";
const MAX_RECENT_PAGES = 12;
const UPDATE_EVENT = "recent-pages-updated";

let cachedClientSnapshot: RecentPageRecord[] = EMPTY_RECENT_PAGES;
let cachedClientSnapshotKey = "";

function isBrowser() {
  return typeof window !== "undefined";
}

function invalidateRecentPagesSnapshot() {
  cachedClientSnapshotKey = "";
  cachedClientSnapshot = EMPTY_RECENT_PAGES;
}

function shouldIncludeInRecentPages(page: Pick<RecentPageRecord, "href" | "iconId">) {
  const href = page.href.trim();
  if (!href || href === "/" || href === "/documents") return false;
  if (page.iconId === "folder") return false;
  return true;
}

function filterRecentPages(pages: RecentPageRecord[]) {
  return pages.filter(shouldIncludeInRecentPages);
}

function isRecentPageRecord(value: unknown): value is RecentPageRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<RecentPageRecord>;
  return (
    typeof record.id === "string" &&
    typeof record.title === "string" &&
    typeof record.href === "string" &&
    typeof record.visitedAt === "string"
  );
}

export function readRecentPages(): RecentPageRecord[] {
  return [...getRecentPagesSnapshot()];
}

export function getRecentPagesSnapshot(): RecentPageRecord[] {
  if (!isBrowser()) return EMPTY_RECENT_PAGES;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      if (cachedClientSnapshotKey !== "") invalidateRecentPagesSnapshot();
      return EMPTY_RECENT_PAGES;
    }

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      if (cachedClientSnapshotKey !== "[]") invalidateRecentPagesSnapshot();
      return EMPTY_RECENT_PAGES;
    }

    const key = raw;
    if (key === cachedClientSnapshotKey) {
      return cachedClientSnapshot;
    }

    const pages = filterRecentPages(parsed.filter(isRecentPageRecord));
    cachedClientSnapshotKey = key;
    cachedClientSnapshot = pages.length > 0 ? pages : EMPTY_RECENT_PAGES;
    return cachedClientSnapshot;
  } catch {
    if (cachedClientSnapshotKey !== "[]") invalidateRecentPagesSnapshot();
    return EMPTY_RECENT_PAGES;
  }
}

export function getServerRecentPagesSnapshot(): RecentPageRecord[] {
  return EMPTY_RECENT_PAGES;
}

function writeRecentPages(pages: RecentPageRecord[]) {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
  invalidateRecentPagesSnapshot();
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

export function recordRecentPage(
  page: Omit<RecentPageRecord, "visitedAt"> & { visitedAt?: string }
) {
  const href = page.href.trim();
  if (!shouldIncludeInRecentPages({ href, iconId: page.iconId })) return;

  const entry: RecentPageRecord = {
    id: page.id,
    title: page.title.trim() || href,
    href,
    visitedAt: page.visitedAt ?? new Date().toISOString(),
    iconId: page.iconId,
  };

  const next = filterRecentPages([
    entry,
    ...getRecentPagesSnapshot().filter((item) => item.href !== href),
  ]).slice(0, MAX_RECENT_PAGES);

  writeRecentPages(next);
}

export function subscribeRecentPages(listener: () => void) {
  if (!isBrowser()) return () => {};

  const handleUpdate = () => listener();
  window.addEventListener(UPDATE_EVENT, handleUpdate);
  window.addEventListener("storage", handleUpdate);

  return () => {
    window.removeEventListener(UPDATE_EVENT, handleUpdate);
    window.removeEventListener("storage", handleUpdate);
  };
}

export function formatRecentVisitedAt(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
  });
}
