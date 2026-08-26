import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { getDocumentColorStyles } from "@/lib/document-colors";
import { cn } from "@/lib/utils";

type RecentPageCardProps = {
  href: string;
  title: string;
  icon: LucideIcon;
  visitedAt?: string;
  colorStyles?: ReturnType<typeof getDocumentColorStyles>;
  className?: string;
};

export function RecentPageCard({
  href,
  title,
  icon: Icon,
  visitedAt,
  colorStyles,
  className,
}: RecentPageCardProps) {
  const hasColor = colorStyles?.hasColor ?? false;

  return (
    <Link
      href={href}
      className={cn(
        "flex aspect-[4/5] w-36 shrink-0 flex-col overflow-hidden rounded-xl border border-border p-4 transition-colors hover:brightness-[0.98] dark:hover:brightness-110 sm:w-40",
        !hasColor && "bg-sidebar hover:bg-hover",
        className
      )}
      style={
        hasColor && colorStyles
          ? { backgroundColor: colorStyles.cardBackground }
          : undefined
      }
    >
      <Icon
        className={cn("h-[18px] w-[18px]", !hasColor && "text-muted")}
        style={hasColor && colorStyles ? { color: colorStyles.accent } : undefined}
        strokeWidth={1.75}
      />

      <div className="mt-auto min-w-0">
        <p className="line-clamp-2 text-left text-sm font-medium leading-snug text-foreground">
          {title}
        </p>
        {visitedAt ? (
          <p className="mt-2 text-xs text-muted">{visitedAt}</p>
        ) : null}
      </div>
    </Link>
  );
}
