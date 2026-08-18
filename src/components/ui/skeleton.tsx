import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "relative overflow-hidden bg-gradient-to-br from-border/30 via-muted/10 to-border/20",
        className
      )}
      {...props}
    >
      <div
        aria-hidden
        className="absolute inset-0 animate-[skeleton-shimmer_2.2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-foreground/[0.05] to-transparent dark:via-foreground/[0.07]"
      />
    </div>
  );
}

export { Skeleton };
