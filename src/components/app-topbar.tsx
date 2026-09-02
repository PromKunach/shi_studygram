"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Folder,
  LogOut,
  Megaphone,
  Menu,
  Newspaper,
  Settings,
  User,
  UserCircle,
  UserX,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { supabase } from "@/lib/supabaseClient";
import { useCurrentUser } from "@/lib/userProfile";
import { cn } from "@/lib/utils";

type AppTopbarProps = {
  sidebarOpen: boolean;
  isDesktop: boolean;
  onOpenSidebar: () => void;
};

function MenuItem({
  href,
  onClick,
  icon: Icon,
  children,
  className,
}: {
  href?: string;
  onClick?: () => void;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  const classes = cn(
    "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes} onClick={onClick}>
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} onClick={onClick}>
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      {children}
    </button>
  );
}

export function AppTopbar({
  sidebarOpen,
  isDesktop,
  onOpenSidebar,
}: AppTopbarProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, ready } = useCurrentUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      localStorage.removeItem("pistar_user");
      setMenuOpen(false);
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  };

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-30 flex shrink-0 items-center gap-3 border-b border-border bg-background px-4 py-3 sm:px-6">
      {(!isDesktop || !sidebarOpen) && (
        <button
          type="button"
          onClick={onOpenSidebar}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:bg-hover",
            !isDesktop && "md:hidden"
          )}
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      <div
        className="relative ml-auto flex items-center gap-2 sm:gap-3"
        ref={menuRef}
      >
        <ThemeToggle />

        {ready && user ? (
          <span className="max-w-[140px] truncate text-sm font-medium text-foreground sm:max-w-[220px]">
            {user.displayName}
          </span>
        ) : ready ? (
          <Link
            href="/login"
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            เข้าสู่ระบบ
          </Link>
        ) : (
          <span
            className="h-8 w-20 animate-pulse rounded-md bg-muted"
            aria-hidden
          />
        )}

        <button
          type="button"
          aria-label="Account menu"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          onClick={() => setMenuOpen((open) => !open)}
          className="rounded-full p-1 transition-colors hover:bg-muted"
        >
          {user?.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={user.displayName}
              width={28}
              height={28}
              unoptimized
              className="h-7 w-7 rounded-full object-cover"
            />
          ) : (
            <User className="h-5 w-5 text-muted-foreground" />
          )}
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg"
          >
            {user ? (
              <>
                <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                  {user.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt={user.displayName}
                      width={40}
                      height={40}
                      unoptimized
                      className="h-10 w-10 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-popover-foreground">
                      {user.displayName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>

                <div className="p-1.5">
                  <MenuItem
                    href="/news"
                    icon={Newspaper}
                    onClick={() => setMenuOpen(false)}
                  >
                    อัพเดตงาน
                  </MenuItem>
                  <MenuItem
                    href="/announces"
                    icon={Megaphone}
                    onClick={() => setMenuOpen(false)}
                  >
                    โน้ตประกาศ
                  </MenuItem>
                  <MenuItem
                    href="/documents"
                    icon={Folder}
                    onClick={() => setMenuOpen(false)}
                  >
                    เอกสาร
                  </MenuItem>
                  <MenuItem
                    href="/appointment"
                    icon={CalendarDays}
                    onClick={() => setMenuOpen(false)}
                  >
                    กำหนดการณ์
                  </MenuItem>
                  <MenuItem
                    href="/"
                    icon={UserCircle}
                    onClick={() => setMenuOpen(false)}
                  >
                    โปรไฟล์
                  </MenuItem>
                  <MenuItem
                    href="/"
                    icon={Settings}
                    onClick={() => setMenuOpen(false)}
                  >
                    ตั้งค่าบัญชี
                  </MenuItem>
                </div>

                <div className="border-t border-border p-1.5">
                  <MenuItem
                    icon={LogOut}
                    onClick={handleSignOut}
                    className="text-red-600 hover:bg-red-500/10 dark:hover:bg-red-500/15"
                  >
                    {signingOut ? "กำลังออก..." : "ออกจากระบบ"}
                  </MenuItem>
                </div>
              </>
            ) : (
              <div className="p-1.5">
                <MenuItem icon={UserX} onClick={() => setMenuOpen(false)}>
                  You are our guest :)
                </MenuItem>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
