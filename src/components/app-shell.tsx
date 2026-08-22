"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { RecentPageTracker } from "@/components/recent-page-tracker";
import { DESKTOP_MEDIA_QUERY, useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
  const [open, setOpen] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (hasInitialized) return;
    setOpen(isDesktop);
    setHasInitialized(true);
  }, [isDesktop, hasInitialized]);

  useEffect(() => {
    if (!hasInitialized) return;
    if (isDesktop) {
      setOpen(true);
      return;
    }
    setOpen(false);
  }, [isDesktop, hasInitialized]);

  useEffect(() => {
    if (!open || isDesktop) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open, isDesktop]);

  const closeSidebar = () => setOpen(false);

  return (
    <div className="flex min-h-screen min-w-0">
      <RecentPageTracker />
      <AnimatePresence>
        {open && !isDesktop && (
          <motion.button
            key="sidebar-backdrop"
            type="button"
            aria-label="Close sidebar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={closeSidebar}
          />
        )}
      </AnimatePresence>

      <AppSidebar
        open={open}
        onCloseSidebar={() => setOpen(false)}
        onNavigate={!isDesktop ? closeSidebar : undefined}
      />

      <div
        className={cn(
          "flex min-h-screen min-w-0 flex-1 flex-col bg-background transition-[margin-left] duration-300 ease-in-out",
          isDesktop && open && "md:ml-[280px]"
        )}
      >
        <AppTopbar
          sidebarOpen={open}
          isDesktop={isDesktop}
          onOpenSidebar={() => setOpen(true)}
        />

        <div className="flex min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
