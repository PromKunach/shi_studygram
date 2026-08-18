import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type RecentPageCardProps = {
  href: string;
  title: string;
  icon: LucideIcon;
  visitedAt?: string;
  highlighted?: boolean;
  className?: string;
};

export function RecentPageCard({
  href,
  title,
  icon: Icon,
  visitedAt,
  highlighted = false,
  className,
}: RecentPageCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "relative flex aspect-[4/5] w-36 shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-sidebar p-4 transition-colors hover:bg-hover sm:w-40",
        highlighted &&
          "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-20 before:bg-gradient-to-b before:from-card-accent/25 before:to-transparent",
        className
      )}
    >
      <div className="relative">
        <Icon
          className={cn(
            "h-[18px] w-[18px]",
            highlighted ? "text-card-accent" : "text-muted"
          )}
          strokeWidth={1.75}
        />
      </div>

      <div className="relative mt-auto">
        <p className="line-clamp-2 text-left text-sm font-medium leading-snug text-foreground">
          {title}
        </p>

        <div className="mt-3 flex items-center gap-2">
          <div
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-border text-[10px] font-medium text-muted"
            aria-hidden
          >
            U
          </div>
          {visitedAt && (
            <span className="text-xs text-muted">{visitedAt}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
