"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, Eye, Link, Pencil, Plus, X, type LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toGoogleDrivePreviewUrl } from "@/lib/document-blocks";
import { cn } from "@/lib/utils";

export const GOOGLE_DRIVE_LOGO_SRC = "/images/drive_logo.png";

export function GoogleDriveLogo({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={GOOGLE_DRIVE_LOGO_SRC}
      alt=""
      className={cn("h-4 w-4 shrink-0 object-contain", className)}
    />
  );
}

export type GoogleDriveFormValues = {
  name: string;
  url: string;
};

type GoogleDriveFormPopoverProps = {
  open: boolean;
  top: number;
  left: number;
  initialValues?: GoogleDriveFormValues;
  title?: string;
  urlPlaceholder?: string;
  kind?: "google-drive" | "link";
  onClose: () => void;
  onSubmit: (values: GoogleDriveFormValues) => void;
};

const POPOVER_WIDTH = 248;

export function GoogleDriveFormPopover({
  open,
  top,
  left,
  initialValues,
  title = "Google Drive",
  urlPlaceholder = "ลิงก์ Google Drive",
  kind = "google-drive",
  onClose,
  onSubmit,
}: GoogleDriveFormPopoverProps) {
  const popoverId = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initialValues?.name ?? "");
  const [url, setUrl] = useState(initialValues?.url ?? "");

  const canSubmit = name.trim().length > 0 && url.trim().length > 0;

  useEffect(() => {
    if (!open) return;
    setName(initialValues?.name ?? "");
    setUrl(initialValues?.url ?? "");
    requestAnimationFrame(() => nameRef.current?.focus());
  }, [initialValues?.name, initialValues?.url, open]);

  useEffect(() => {
    if (!open) return;

    const closeOnOutside = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      const popover = document.getElementById(popoverId);
      if (popover?.contains(target)) return;
      onClose();
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose, open, popoverId]);

  if (!open) return null;

  const leftPosition = Math.min(
    Math.max(8, left),
    window.innerWidth - POPOVER_WIDTH - 8
  );

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({ name: name.trim(), url: url.trim() });
  };

  return createPortal(
    <div
      id={popoverId}
      className="fixed z-[60] overflow-hidden rounded-xl border border-border bg-background shadow-lg"
      style={{ top, left: leftPosition, width: POPOVER_WIDTH }}
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          {kind === "link" ? (
            <Link className="h-4 w-4 text-muted" />
          ) : (
            <GoogleDriveLogo className="h-4 w-4" />
          )}
          <p className="text-xs font-medium text-foreground">{title}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-md p-1 text-muted transition-colors hover:bg-hover hover:text-foreground"
          aria-label="ปิด"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="space-y-2 p-3">
        <input
          ref={nameRef}
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="ชื่อลิงก์"
          className="h-8 w-full rounded-md border border-border bg-sidebar px-2.5 text-sm text-foreground outline-none placeholder:text-muted focus:border-foreground/20"
        />
        <input
          type="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleSubmit();
            }
          }}
          placeholder={urlPlaceholder}
          className="h-8 w-full rounded-md border border-border bg-sidebar px-2.5 text-sm text-foreground outline-none placeholder:text-muted focus:border-foreground/20"
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={cn(
            "flex h-8 w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border border-border bg-sidebar text-sm font-medium transition-colors",
            canSubmit
              ? "text-foreground hover:bg-hover"
              : "cursor-not-allowed text-muted opacity-50"
          )}
        >
          <Plus className="h-3.5 w-3.5" />
          {kind === "link" ? "เพิ่มลิงก์" : "เพิ่ม"}
        </button>
      </div>
    </div>,
    document.body
  );
}

type DocumentChipMenuProps = {
  open: boolean;
  top: number;
  left: number;
  onClose: () => void;
  onEdit: () => void;
  secondaryLabel: string;
  onSecondary: () => void;
  SecondaryIcon?: LucideIcon;
};

const MENU_WIDTH = 152;

export function DocumentChipMenu({
  open,
  top,
  left,
  onClose,
  onEdit,
  secondaryLabel,
  onSecondary,
  SecondaryIcon = Eye,
}: DocumentChipMenuProps) {
  const menuId = useId();
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const closeOnOutside = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      const menu = document.getElementById(menuId);
      if (menu?.contains(target)) return;
      onClose();
    };

    document.addEventListener("mousedown", closeOnOutside);
    return () => document.removeEventListener("mousedown", closeOnOutside);
  }, [menuId, onClose, open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      id={menuId}
      role="menu"
      className="fixed z-[60] overflow-hidden rounded-xl border border-border bg-background p-1 shadow-lg"
      style={{
        top,
        left: Math.min(Math.max(8, left), window.innerWidth - MENU_WIDTH - 8),
        width: MENU_WIDTH,
      }}
    >
      <button
        type="button"
        role="menuitem"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => {
          onEdit();
          onClose();
        }}
        className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-hover"
      >
        <Pencil className="h-4 w-4 text-muted" />
        แก้ไข
      </button>
      <button
        type="button"
        role="menuitem"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => {
          onSecondary();
          onClose();
        }}
        className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-hover"
      >
        <SecondaryIcon className="h-4 w-4 text-muted" />
        {secondaryLabel}
      </button>
    </div>,
    document.body
  );
}

type GoogleDrivePreviewModalProps = {
  open: boolean;
  name: string;
  url: string;
  onClose: () => void;
  onEdit?: () => void;
};

export function GoogleDrivePreviewModal({
  open,
  name,
  url,
  onClose,
  onEdit,
}: GoogleDrivePreviewModalProps) {
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, open]);

  const previewUrl = toGoogleDrivePreviewUrl(url);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6">
          <motion.button
            type="button"
            aria-label="ปิดพรีวิว"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 cursor-pointer bg-black/50 backdrop-blur-sm"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`พรีวิว ${name}`}
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{
              type: "spring",
              stiffness: 380,
              damping: 28,
              mass: 0.8,
            }}
            className="relative flex h-[min(85vh,720px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
          >
            <header className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
              <GoogleDriveLogo className="h-5 w-5" />
              <h2 className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                {name}
              </h2>
              {onEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-hover"
                >
                  <Pencil className="h-3.5 w-3.5 text-muted" />
                  แก้ไข
                </button>
              )}
              {url.trim() ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-hover"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-muted" />
                  Open on new page
                </a>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer rounded-lg p-1.5 text-muted transition-colors hover:bg-hover hover:text-foreground"
                aria-label="ปิด"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="min-h-0 flex-1 bg-sidebar">
              {previewUrl ? (
                <iframe
                  title={`พรีวิว ${name}`}
                  src={previewUrl}
                  className="h-full w-full border-0"
                  allow="autoplay"
                />
              ) : (
                <div className="flex h-full items-center justify-center px-6 text-sm text-muted">
                  ไม่สามารถแสดงพรีวิวลิงก์นี้ได้
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function createInlineChipElement(
  inline: {
    id: string;
    name: string;
    url: string;
    type?: "google-drive" | "link";
  },
  options?: { isFirstOnLine?: boolean }
) {
  const chip = document.createElement("span");
  chip.contentEditable = "false";
  chip.dataset.inlineId = inline.id;
  chip.dataset.inlineType = inline.type ?? "google-drive";
  chip.dataset.driveUrl = inline.url;
  chip.dataset.driveName = inline.name;
  chip.className = [
    "inline-flex max-w-[12rem] translate-y-[-1px] cursor-pointer items-center gap-1 rounded-md border border-border bg-sidebar px-2 py-0.5 align-middle text-sm font-medium text-foreground select-none",
    options?.isFirstOnLine ? "mr-1" : "mx-1",
  ].join(" ");

  if (inline.type === "link") {
    chip.appendChild(createLinkIconElement());
  } else {
    const icon = document.createElement("img");
    icon.src = GOOGLE_DRIVE_LOGO_SRC;
    icon.alt = "";
    icon.className = "h-3.5 w-3.5 shrink-0 object-contain";
    icon.draggable = false;
    chip.appendChild(icon);
  }

  const label = document.createElement("span");
  label.className = "truncate";
  label.textContent = inline.name;

  chip.appendChild(label);
  return chip;
}

function createLinkIconElement() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("class", "h-3.5 w-3.5 shrink-0 text-muted");

  const pathOne = document.createElementNS("http://www.w3.org/2000/svg", "path");
  pathOne.setAttribute(
    "d",
    "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
  );
  const pathTwo = document.createElementNS("http://www.w3.org/2000/svg", "path");
  pathTwo.setAttribute(
    "d",
    "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
  );
  svg.appendChild(pathOne);
  svg.appendChild(pathTwo);
  return svg;
}
