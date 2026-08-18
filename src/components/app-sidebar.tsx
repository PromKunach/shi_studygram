"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight, Clock, PanelLeftClose } from "lucide-react";
import {
  getPageMeta,
  isExternalHref,
  isExactNavMatch,
  isNavItemActive,
  NAV_SECTIONS,
  RECENT_PAGES,
  RECENT_SECTION_LABEL,
  type NavSubItem,
} from "@/lib/navigation";
import { cn } from "@/lib/utils";

type AppSidebarProps = {
  open: boolean;
  collapsed: boolean;
  isMobile?: boolean;
  onToggleCollapsed: () => void;
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
  collapsed,
  labelClass,
  isOpen,
  onToggle,
  pathname,
  onNavigate,
}: {
  collapsed: boolean;
  labelClass: string;
  isOpen: boolean;
  onToggle: () => void;
  pathname: string;
  onNavigate?: () => void;
}) {
  if (collapsed) return null;

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={onToggle}
        className="group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-foreground hover:bg-hover"
      >
        <Clock className="h-[18px] w-[18px] shrink-0" />
        <span className={cn("flex-1 truncate text-left", labelClass)}>
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
          {RECENT_PAGES.length === 0 ? (
            <p className="px-2.5 py-1.5 text-sm text-muted">No recent pages yet</p>
          ) : (
            <ul className="space-y-0.5">
              {RECENT_PAGES.map((page) => {
                const isActive = isExactNavMatch(pathname, page.href);
                const meta = getPageMeta(page.href);
                const Icon = meta?.icon;
                return (
                  <li key={`${page.label}-${page.href}`}>
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
                      {Icon && <Icon className="h-4 w-4 shrink-0" />}
                      <span className="truncate">{page.label}</span>
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
  collapsed,
  isMobile = false,
  onToggleCollapsed,
  onCloseSidebar,
  onNavigate,
}: AppSidebarProps) {
  const pathname = usePathname();
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const labelClass = collapsed ? "sr-only" : "";

  const toggleItem = (label: string) => {
    setOpenItems((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <motion.aside
      initial={false}
      animate={{ x: open ? 0 : "-100%" }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex h-dvh flex-col border-r border-border bg-sidebar will-change-transform",
        collapsed && !isMobile ? "w-[76px]" : "w-[min(280px,85vw)] sm:w-[280px]"
      )}
    >
      <header
        className={cn(
          "flex items-center border-b border-border py-4",
          collapsed && !isMobile ? "justify-center px-2" : "justify-between px-4"
        )}
      >
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
        {onCloseSidebar && !collapsed && (
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
              <p
                className={cn(
                  "mb-1 px-2 text-xs uppercase tracking-wide text-muted",
                  labelClass
                )}
              >
                {section.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isOpen = openItems[item.label] ?? false;
                const isActive = isNavItemActive(pathname, item);
                const canExpand = item.expandable && !collapsed;
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
                          navItemClass,
                          collapsed && "justify-center"
                        )}
                        title={collapsed ? item.label : undefined}
                      >
                        <item.icon className="h-[18px] w-[18px] shrink-0" />
                        <span className={cn("flex-1 truncate", labelClass)}>
                          {item.label}
                        </span>
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
          collapsed={collapsed}
          labelClass={labelClass}
          isOpen={openItems[RECENT_OPEN_KEY] ?? true}
          onToggle={() => toggleItem(RECENT_OPEN_KEY)}
          pathname={pathname}
          onNavigate={onNavigate}
        />
      </nav>

      <footer
        className={cn(
          "flex items-center border-t border-border p-3",
          isMobile ? "hidden" : "justify-start"
        )}
      >
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-hover hover:text-foreground"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <PanelLeftClose
            className={cn(
              "h-4 w-4 transition-transform",
              collapsed && "rotate-180"
            )}
          />
        </button>
      </footer>
    </motion.aside>
  );
}
