import { Plus } from "lucide-react";
import {
  DOCUMENT_CARD_CAPTION_GAP,
  DOCUMENT_CARD_HEIGHT,
  DOCUMENT_CARD_PADDING,
  DOCUMENT_CARD_RADIUS,
  DOCUMENT_CARD_WIDTH,
  NEW_DOCUMENT_ICON_WRAP,
  NEW_DOCUMENT_PLUS_ICON,
} from "@/components/documents/document-card-metrics";
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
        "flex shrink-0 flex-col text-left",
        DOCUMENT_CARD_WIDTH,
        className
      )}
    >
      <div
        className={cn(
          "relative flex aspect-[4/5] flex-col items-center justify-center overflow-hidden border border-dashed border-border bg-sidebar text-center transition-colors hover:border-foreground/20 hover:bg-hover",
          DOCUMENT_CARD_PADDING,
          DOCUMENT_CARD_RADIUS,
          DOCUMENT_CARD_HEIGHT
        )}
      >
        <div
          className={cn(
            "flex items-center justify-center rounded-full bg-hover text-muted",
            NEW_DOCUMENT_ICON_WRAP
          )}
        >
          <Plus className={NEW_DOCUMENT_PLUS_ICON} strokeWidth={1.75} />
        </div>
      </div>
      <p
        className={cn(
          "text-xs font-medium text-muted sm:text-sm",
          DOCUMENT_CARD_CAPTION_GAP
        )}
      >
        เอกสารใหม่
      </p>
    </button>
  );
}
