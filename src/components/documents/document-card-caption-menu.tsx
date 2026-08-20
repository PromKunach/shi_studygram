"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Pencil, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { DOCUMENT_CARD_CAPTION_GAP } from "@/components/documents/document-card-metrics";
import { cn } from "@/lib/utils";

const MENU_MIN_WIDTH = 152;

type DocumentCardCaptionMenuProps = {
  title: string;
  updatedAt?: string;
  typeLabel: "folder" | "document";
  className?: string;
  onEdit: () => void;
  onDelete: () => void;
  isBusy?: boolean;
};

export function DocumentCardCaptionMenu({
  title,
  updatedAt,
  typeLabel,
  className,
  onEdit,
  onDelete,
  isBusy = false,
}: DocumentCardCaptionMenuProps) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const left = Math.min(
      Math.max(8, rect.right - MENU_MIN_WIDTH),
      window.innerWidth - MENU_MIN_WIDTH - 8
    );

    setMenuPosition({
      top: rect.bottom + 4,
      left,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setMenuPosition(null);
      return;
    }

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [open, updateMenuPosition]);

  useEffect(() => {
    if (!open) {
      setConfirmDelete(false);
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const deleteLabel = typeLabel === "folder" ? "โฟลเดอร์" : "เอกสาร";

  const menu =
    open && menuPosition
      ? createPortal(
          <AnimatePresence>
            <motion.div
              ref={menuRef}
              id={menuId}
              role="menu"
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position: "fixed",
                top: menuPosition.top,
                left: menuPosition.left,
                minWidth: MENU_MIN_WIDTH,
                zIndex: 200,
              }}
              className="overflow-hidden rounded-xl border border-border bg-background p-1 shadow-lg"
              onClick={(event) => event.stopPropagation()}
            >
              {confirmDelete ? (
                <div className="px-2 py-1.5">
                  <p className="mb-2 text-xs leading-snug text-muted">
                    ลบ{deleteLabel}นี้ถาวร?
                  </p>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      role="menuitem"
                      disabled={isBusy}
                      onClick={() => setConfirmDelete(false)}
                      className="flex-1 rounded-lg px-2 py-1.5 text-xs text-muted hover:bg-hover"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      disabled={isBusy}
                      onClick={() => {
                        onDelete();
                        setOpen(false);
                      }}
                      className="flex-1 rounded-lg bg-destructive/10 px-2 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/15"
                    >
                      {isBusy ? "กำลังลบ..." : "ลบ"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    role="menuitem"
                    disabled={isBusy}
                    onClick={() => {
                      onEdit();
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-foreground hover:bg-hover"
                  >
                    <Pencil className="h-3.5 w-3.5 shrink-0" />
                    แก้ไข
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    disabled={isBusy}
                    onClick={() => setConfirmDelete(true)}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5 shrink-0" />
                    ลบ
                  </button>
                </>
              )}
            </motion.div>
          </AnimatePresence>,
          document.body
        )
      : null;

  return (
    <>
      <div
        ref={rootRef}
        className={cn("relative min-w-0", DOCUMENT_CARD_CAPTION_GAP, className)}
      >
        <div className="flex items-start gap-0.5">
          <p className="min-w-0 flex-1 line-clamp-2 text-left text-xs font-medium leading-snug text-foreground sm:text-sm">
            {title}
          </p>
          <button
            ref={triggerRef}
            type="button"
            aria-expanded={open}
            aria-haspopup="menu"
            aria-controls={menuId}
            disabled={isBusy}
            onClick={(event) => {
              event.stopPropagation();
              if (!open) {
                updateMenuPosition();
              }
              setOpen((current) => !current);
            }}
            className={cn(
              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-hover hover:text-foreground",
              open && "bg-hover text-foreground"
            )}
            aria-label={`เมนู${deleteLabel}`}
          >
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-200",
                open && "rotate-180"
              )}
            />
          </button>
        </div>

        {updatedAt && (
          <p className="mt-0.5 text-[10px] text-muted sm:text-xs">{updatedAt}</p>
        )}
      </div>
      {menu}
    </>
  );
}
