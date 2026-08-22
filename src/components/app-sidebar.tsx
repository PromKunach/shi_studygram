"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import {
  isExternalHref,
  isExactNavMatch,
  isNavItemActive,
  NAV_SECTIONS,
  RECENT_SECTION_LABEL,
  resolveRecentPageDisplay,
  type NavSubItem,
} from "@/lib/navigation";
import { useRecentPages } from "@/hooks/use-recent-pages";
import { cn } from "@/lib/utils";

type AppSidebarProps = {
  open: boolean;
  onCloseSidebar?: () => void;
  onNavigate?: () => void;
};

function NavSubLink({
  href,
  label,
  className,
  openInNewTab,
  onNavigate,
}: NavSubItem & { className?: string; onNavigate?: () => void }) {
  const trimmedHref = href.trim();
  const external = isExternalHref(trimmedHref) || openInNewTab;

  if (external) {
    return (
      <a
        href={trimmedHref}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {label}
      </a>
    );
  }

  return (
    <Link href={trimmedHref} className={className} onClick={onNavigate}>
      {label}
    </Link>
  );
}

const RECENT_OPEN_KEY = "__recent__";

function RecentSection({
  isOpen,
  onToggle,
  pathname,
  onNavigate,
}: {
  isOpen: boolean;
  onToggle: () => void;
  pathname: string;
  onNavigate?: () => void;
}) {
  const recentPages = useRecentPages().map(resolveRecentPageDisplay);

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={onToggle}
        className="group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-foreground hover:bg-hover"
      >
        <Clock className="h-[18px] w-[18px] shrink-0" />
        <span className="flex-1 truncate text-left">
          {RECENT_SECTION_LABEL}
        </span>
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-muted transition-transform duration-200",
            isOpen && "rotate-90"
          )}
        />
      </button>

      <div
        className={cn(
          "grid transition-all duration-200 ease-in-out",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          {recentPages.length === 0 ? (
            <p className="px-2.5 py-1.5 text-sm text-muted">No recent pages yet</p>
          ) : (
            <ul className="space-y-0.5">
              {recentPages.map((page) => {
                const isActive = isExactNavMatch(pathname, page.href);
                const Icon = page.icon;
                return (
                  <li key={`${page.id}-${page.href}`}>
                    <Link
                      href={page.href}
                      onClick={onNavigate}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm",
                        isActive
                          ? "bg-hover text-foreground"
                          : "text-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{page.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export function AppSidebar({
  open,
  onCloseSidebar,
  onNavigate,
}: AppSidebarProps) {
  const pathname = usePathname();
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (label: string) => {
    setOpenItems((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <motion.aside
      initial={false}
      animate={{ x: open ? 0 : "-100%" }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-y-0 left-0 z-50 flex h-dvh w-[min(280px,85vw)] flex-col border-r border-border bg-sidebar will-change-transform sm:w-[280px]"
    >
      <header className="flex items-center justify-between border-b border-border px-4 py-4">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex shrink-0 items-center"
          aria-label="Shi studygram"
        >
          <Image
            src="/images/icon_dark.png"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 dark:hidden"
            priority
          />
          <Image
            src="/images/icon_light.png"
            alt=""
            width={32}
            height={32}
            className="hidden h-8 w-8 dark:block"
            priority
          />
        </Link>
        {onCloseSidebar && (
          <button
            type="button"
            onClick={onCloseSidebar}
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted hover:bg-hover hover:text-foreground"
            aria-label="Close sidebar"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
      </header>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        {NAV_SECTIONS.map((section, index) => (
          <div key={section.title ?? `section-${index}`} className={index === 0 ? "" : "mt-5"}>
            {section.title && section.items.length > 0 && (
              <p className="mb-1 px-2 text-xs uppercase tracking-wide text-muted">
                {section.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isOpen = openItems[item.label] ?? false;
                const isActive = isNavItemActive(pathname, item);
                const canExpand = item.expandable;
                const navItemClass = isActive
                  ? "bg-hover text-foreground"
                  : "text-foreground hover:bg-hover";

                return (
                  <li key={item.label}>
                    {canExpand ? (
                      <button
                        type="button"
                        onClick={() => toggleItem(item.label)}
                        className={cn(
                          "group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium",
                          navItemClass
                        )}
                      >
                        <item.icon className="h-[18px] w-[18px] shrink-0" />
                        <span className="flex-1 truncate text-left">{item.label}</span>
                        <ChevronRight
                          className={cn(
                            "h-3.5 w-3.5 shrink-0 text-muted transition-transform duration-200",
                            isOpen && "rotate-90"
                          )}
                        />
                      </button>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                          "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium",
                          navItemClass
                        )}
                      >
                        <item.icon className="h-[18px] w-[18px] shrink-0" />
                        <span className="flex-1 truncate">{item.label}</span>
                      </Link>
                    )}

                    {canExpand && item.children && (
                      <div
                        className={cn(
                          "grid transition-all duration-200 ease-in-out",
                          isOpen
                            ? "grid-rows-[1fr] opacity-100"
                            : "grid-rows-[0fr] opacity-0"
                        )}
                      >
                        <ul className="overflow-hidden pl-9">
                          {item.children.map((sub) => {
                            const isSubActive = isExactNavMatch(
                              pathname,
                              sub.href
                            );
                            return (
                              <li key={`${sub.label}-${sub.href}`}>
                                <NavSubLink
                                  {...sub}
                                  onNavigate={onNavigate}
                                  className={cn(
                                    "block w-full rounded-md py-1.5 text-left text-sm",
                                    isSubActive
                                      ? "bg-hover text-foreground"
                                      : "text-muted hover:text-foreground"
                                  )}
                                />
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <RecentSection
          isOpen={openItems[RECENT_OPEN_KEY] ?? true}
          onToggle={() => toggleItem(RECENT_OPEN_KEY)}
          pathname={pathname}
          onNavigate={onNavigate}
        />
      </nav>
    </motion.aside>
  );
}
