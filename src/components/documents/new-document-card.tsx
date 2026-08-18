import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type NewDocumentCardProps = {
  onClick?: () => void;
  className?: string;
};

export function NewDocumentCard({ onClick, className }: NewDocumentCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex aspect-[4/5] w-36 shrink-0 flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-sidebar p-4 text-center transition-colors hover:border-foreground/20 hover:bg-hover sm:w-40",
        className
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-hover text-muted">
        <Plus className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <p className="mt-4 text-sm font-medium text-muted">เอกสารใหม่</p>
    </button>
  );
}
