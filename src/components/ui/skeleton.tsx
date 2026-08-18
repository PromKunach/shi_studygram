import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "relative overflow-hidden bg-gradient-to-br from-border/20 via-muted/8 to-border/12",
        className
      )}
      {...props}
    >
      <div
        aria-hidden
        className="absolute inset-0 animate-[skeleton-shimmer_2.4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-foreground/[0.04] to-transparent dark:via-foreground/[0.05]"
      />
    </div>
  );
}

export { Skeleton };
