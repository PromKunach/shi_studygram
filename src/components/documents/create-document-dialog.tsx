"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ChevronDown, FileText, Folder, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_DOCUMENT_COLOR,
  DOCUMENT_COLOR_OPTIONS,
  getDocumentColorOption,
  type DocumentColorId,
} from "@/lib/document-colors";
import { DocumentCardPreview } from "@/components/documents/document-card";
import type { DocumentItem } from "@/components/documents/document-card";
import {
  defaultIconForType,
  DOCUMENT_ICON_OPTIONS,
  type DocumentContentType,
  type DocumentIconId,
} from "@/lib/document-icons";
import { cn } from "@/lib/utils";

export type CreateDocumentPayload = {
  title: string;
  description?: string;
  type: DocumentContentType;
  icon: DocumentIconId;
  color: DocumentColorId;
  driveUrl?: string;
};

type DocumentDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateDocumentPayload) => void;
  document?: DocumentItem;
  onDelete?: () => void;
  isBusy?: boolean;
  focusField?: "description";
};

const TYPE_OPTIONS: {
  value: DocumentContentType;
  label: string;
  icon: typeof Folder;
}[] = [
  { value: "folder", label: "โฟลเดอร์", icon: Folder },
  { value: "document", label: "เอกสาร", icon: FileText },
];

const SCROLL_FADE_RAMP_PX = 48;

function getBottomFadeOpacity(scrollTop: number, scrollHeight: number, clientHeight: number) {
  const maxScroll = scrollHeight - clientHeight;
  if (maxScroll <= 1) return 0;
  const remaining = maxScroll - scrollTop;
  return Math.min(1, remaining / SCROLL_FADE_RAMP_PX);
}

function DocumentDialog({
  open,
  onClose,
  onSubmit,
  document: editingDocument,
  onDelete,
  isBusy = false,
  focusField,
}: DocumentDialogProps) {
  const isEdit = Boolean(editingDocument);
  const titleId = isEdit ? "edit-document-title" : "create-document-title";
  const listboxId = useId();
  const iconMenuRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<DocumentContentType>("document");
  const [icon, setIcon] = useState<DocumentIconId>("file-text");
  const [color, setColor] = useState<DocumentColorId>(DEFAULT_DOCUMENT_COLOR);
  const [driveUrl, setDriveUrl] = useState("");
  const [iconMenuOpen, setIconMenuOpen] = useState(false);
  const [bottomFade, setBottomFade] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const updateBottomFade = useCallback(() => {
    const el = scrollRef.current;
    if (!el) {
      setBottomFade(0);
      return;
    }

    setBottomFade(
      getBottomFadeOpacity(el.scrollTop, el.scrollHeight, el.clientHeight)
    );
  }, []);

  const selectedColor = getDocumentColorOption(color);

  const selectedIcon =
    DOCUMENT_ICON_OPTIONS.find((option) => option.id === icon) ??
    DOCUMENT_ICON_OPTIONS[0];
  const SelectedIcon = selectedIcon.icon;
  const trimmed = title.trim();
  const canSubmit = trimmed.length > 0;

  useEffect(() => {
    if (!open) return;
    setConfirmDelete(false);
    if (editingDocument) {
      setTitle(editingDocument.title);
      setDescription(editingDocument.description ?? "");
      setType(editingDocument.type);
      setIcon(editingDocument.icon);
      setColor(editingDocument.color);
      setDriveUrl(editingDocument.driveUrl ?? "");
    } else {
      setTitle("");
      setDescription("");
      setType("document");
      setIcon("file-text");
      setColor(DEFAULT_DOCUMENT_COLOR);
      setDriveUrl("");
    }
    setIconMenuOpen(false);

    const frame = window.requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = 0;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open, editingDocument]);

  useEffect(() => {
    if (!open || focusField !== "description") return;

    const frame = window.requestAnimationFrame(() => {
      const el = descriptionRef.current;
      if (!el) return;
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      el.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open, focusField]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (iconMenuOpen) {
          setIconMenuOpen(false);
          return;
        }
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose, iconMenuOpen]);

  useEffect(() => {
    if (!iconMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (
        iconMenuRef.current &&
        !iconMenuRef.current.contains(event.target as Node)
      ) {
        setIconMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [iconMenuOpen]);

  useEffect(() => {
    if (!open) return;

    updateBottomFade();
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener("scroll", updateBottomFade, { passive: true });
    window.addEventListener("resize", updateBottomFade);

    const observer = new ResizeObserver(updateBottomFade);
    observer.observe(el);

    return () => {
      el.removeEventListener("scroll", updateBottomFade);
      window.removeEventListener("resize", updateBottomFade);
      observer.disconnect();
    };
  }, [open, updateBottomFade, type, color, iconMenuOpen, trimmed]);

  const handleTypeChange = (nextType: DocumentContentType) => {
    setType(nextType);
    if (nextType === "folder") setDriveUrl("");
    setIcon((current) => {
      const folderDefault = defaultIconForType("folder");
      const documentDefault = defaultIconForType("document");
      if (current === folderDefault || current === documentDefault) {
        return defaultIconForType(nextType);
      }
      return current;
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.button
            type="button"
            aria-label="ปิดหน้าต่าง"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 28, mass: 0.8 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-border bg-background shadow-xl"
          >
            <div className="border-b border-border px-6 pb-4 pt-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2
                    id={titleId}
                    className="text-lg font-semibold text-foreground"
                  >
                    {isEdit ? "แก้ไข" : "สร้างใหม่"}
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    {isEdit
                      ? "ปรับประเภท สี ไอคอน หรือชื่อ"
                      : "เลือกประเภท สี ไอคอน และตั้งชื่อ"}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={onClose}
                  aria-label="ปิด"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="relative">
              <div
                ref={scrollRef}
                className="max-h-[min(calc(100dvh-7rem),32rem)] overflow-y-auto overscroll-contain px-6 py-5 [scrollbar-width:thin]"
              >
                <motion.div
                  key={`${type}-${color}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22 }}
                  className="mb-5 rounded-2xl border border-border bg-sidebar/60 px-3 py-4"
                >
                  <DocumentCardPreview
                    type={type}
                    color={color}
                    icon={icon}
                    title={trimmed}
                  />
                </motion.div>

                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (!canSubmit || isBusy) return;
                    onSubmit({
                      title: trimmed,
                      description: description.trim(),
                      type,
                      icon,
                      color,
                      driveUrl: type === "document" ? driveUrl.trim() : "",
                    });
                    if (!isEdit) onClose();
                  }}
                  className="space-y-5"
                >
                <div className="space-y-2">
                  <Label>ประเภท</Label>
                  <div className="relative mt-2 flex rounded-xl bg-sidebar p-1">
                    {TYPE_OPTIONS.map((option) => {
                      const isActive = type === option.value;
                      const OptionIcon = option.icon;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleTypeChange(option.value)}
                          className={cn(
                            "relative z-10 flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                            isActive
                              ? "text-foreground"
                              : "text-muted hover:text-foreground"
                          )}
                          aria-pressed={isActive}
                        >
                          {isActive && (
                            <motion.span
                              layoutId="document-type-pill"
                              className="absolute inset-0 rounded-lg border border-border bg-background shadow-sm"
                              transition={{
                                type: "spring",
                                stiffness: 420,
                                damping: 32,
                              }}
                            />
                          )}
                          <OptionIcon className="relative h-4 w-4 shrink-0" />
                          <span className="relative">{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label>สี</Label>
                    <span className="text-xs text-muted">{selectedColor.label}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-6 gap-2">
                    {DOCUMENT_COLOR_OPTIONS.map((option, index) => {
                      const isSelected = color === option.id;

                      return (
                        <motion.button
                          key={option.id}
                          type="button"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.03, duration: 0.18 }}
                          onClick={() => setColor(option.id)}
                          aria-label={option.label}
                          aria-pressed={isSelected}
                          className={cn(
                            "relative aspect-square rounded-xl p-0.5 transition-shadow",
                            isSelected
                              ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                              : "hover:ring-1 hover:ring-border"
                          )}
                        >
                          <span
                            className={cn(
                              "block h-full w-full rounded-[10px] shadow-sm",
                              option.id === "none" &&
                                "border border-dashed border-border bg-sidebar"
                            )}
                            style={
                              option.from && option.to
                                ? {
                                    background: option.from,
                                  }
                                : undefined
                            }
                          />
                          {isSelected && (
                            <motion.span
                              layoutId="document-color-check"
                              className="absolute inset-0 flex items-center justify-center"
                              transition={{
                                type: "spring",
                                stiffness: 420,
                                damping: 30,
                              }}
                            >
                              <span
                                className={cn(
                                  "h-2 w-2 rounded-full shadow-sm",
                                  option.id === "none"
                                    ? "bg-foreground"
                                    : "bg-white"
                                )}
                              />
                            </motion.span>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document-icon-picker">ไอคอน</Label>
                  <div ref={iconMenuRef} className="relative mt-2">
                    <button
                      id="document-icon-picker"
                      type="button"
                      aria-haspopup="listbox"
                      aria-expanded={iconMenuOpen}
                      aria-controls={listboxId}
                      onClick={() => setIconMenuOpen((current) => !current)}
                      className={cn(
                        "flex h-10 w-full items-center justify-between rounded-lg border border-border bg-sidebar px-3 text-sm transition-colors hover:bg-hover",
                        iconMenuOpen && "border-foreground/20 bg-hover"
                      )}
                    >
                      <span className="flex items-center gap-2.5 text-foreground">
                        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-background">
                          <SelectedIcon className="h-4 w-4 text-foreground" />
                        </span>
                        {selectedIcon.label}
                      </span>
                      <motion.span
                        animate={{ rotate: iconMenuOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="h-4 w-4 text-muted" />
                      </motion.span>
                    </button>

                    <AnimatePresence>
                      {iconMenuOpen && (
                        <motion.div
                          id={listboxId}
                          role="listbox"
                          aria-label="เลือกไอคอน"
                          initial={{ opacity: 0, y: -6, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, scale: 0.98 }}
                          transition={{
                            type: "spring",
                            stiffness: 420,
                            damping: 30,
                            mass: 0.7,
                          }}
                          className="absolute top-[calc(100%+0.5rem)] z-20 max-h-56 w-full overflow-y-auto rounded-xl border border-border bg-background p-2 shadow-lg"
                        >
                          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
                            {DOCUMENT_ICON_OPTIONS.map((option, index) => {
                              const Icon = option.icon;
                              const isSelected = icon === option.id;

                              return (
                                <motion.button
                                  key={option.id}
                                  type="button"
                                  role="option"
                                  aria-selected={isSelected}
                                  initial={{ opacity: 0, y: 6 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{
                                    delay: index * 0.02,
                                    duration: 0.18,
                                  }}
                                  onClick={() => {
                                    setIcon(option.id);
                                    setIconMenuOpen(false);
                                  }}
                                  className={cn(
                                    "flex flex-col items-center gap-1.5 rounded-lg px-2 py-2.5 text-center text-xs transition-colors",
                                    isSelected
                                      ? "bg-hover text-foreground ring-1 ring-border"
                                      : "text-muted hover:bg-hover hover:text-foreground"
                                  )}
                                >
                                  <Icon className="h-4 w-4 shrink-0" />
                                  <span className="line-clamp-2 leading-tight">
                                    {option.label}
                                  </span>
                                </motion.button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document-name">ชื่อ</Label>
                  <Input
                    id="document-name"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder={
                      type === "folder"
                        ? "เช่น วิชาคณิตศาสตร์"
                        : "เช่น บันทึกการบ้าน"
                    }
                    className="mt-2 h-10 bg-sidebar shadow-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document-description">คำอธิบาย</Label>
                  <textarea
                    ref={descriptionRef}
                    id="document-description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="เช่น วิชาชีววิทยา การสืบพันธุ์ สรุปบทเรียน"
                    rows={3}
                    maxLength={500}
                    className="mt-2 w-full resize-none rounded-lg border border-border bg-sidebar px-3 py-2 text-sm text-foreground shadow-none outline-none transition-colors placeholder:text-muted focus:border-foreground/20 focus:bg-hover"
                  />
                  <p className="text-xs text-muted">
                    ช่วยให้ AI ค้นหาเอกสารได้แม่นยำขึ้น
                  </p>
                </div>

                {type === "document" && (
                  <div className="space-y-2">
                    <Label htmlFor="document-drive-url">ลิงก์ Google Drive</Label>
                    <Input
                      id="document-drive-url"
                      type="url"
                      value={driveUrl}
                      onChange={(event) => setDriveUrl(event.target.value)}
                      placeholder="https://drive.google.com/..."
                      className="mt-2 h-10 bg-sidebar shadow-none"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onClose}
                    disabled={isBusy}
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    type="submit"
                    variant="outline"
                    className="border-border bg-white text-black hover:bg-hover dark:bg-white dark:hover:bg-white/90"
                    disabled={!canSubmit || isBusy}
                  >
                    {isBusy
                      ? isEdit
                        ? "กำลังบันทึก..."
                        : "กำลังสร้าง..."
                      : isEdit
                        ? "บันทึก"
                        : "สร้าง"}
                  </Button>
                </div>

                {isEdit && onDelete && (
                  <div className="rounded-xl border border-red-200 bg-red-50/50 p-3 dark:border-red-900/50 dark:bg-red-950/20">
                    <p className="mb-2 text-xs font-medium text-red-700 dark:text-red-400">
                      โซนอันตราย
                    </p>
                    {confirmDelete ? (
                      <div className="space-y-2">
                        <p className="text-sm text-red-700 dark:text-red-300">
                          ลบ{type === "folder" ? "โฟลเดอร์" : "เอกสาร"}นี้ถาวร?
                          การกระทำนี้ย้อนกลับไม่ได้
                        </p>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmDelete(false)}
                            disabled={isBusy}
                          >
                            ยกเลิก
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              onDelete();
                              setConfirmDelete(false);
                            }}
                            disabled={isBusy}
                          >
                            {isBusy ? "กำลังลบ..." : "ยืนยันการลบ"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => setConfirmDelete(true)}
                        disabled={isBusy}
                      >
                        ลบ{type === "folder" ? "โฟลเดอร์" : "เอกสาร"}
                      </Button>
                    )}
                  </div>
                )}
                </form>
              </div>

              <div
                aria-hidden
                style={{ opacity: bottomFade }}
                className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12 bg-gradient-to-t from-background from-20% via-background/75 to-transparent"
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function CreateDocumentDialog(
  props: Omit<DocumentDialogProps, "document" | "onDelete">
) {
  return <DocumentDialog {...props} />;
}

export function EditDocumentDialog({
  document,
  onDelete,
  focusField,
  ...props
}: Omit<DocumentDialogProps, "document" | "onDelete"> & {
  document: DocumentItem;
  onDelete: () => void;
  focusField?: "description";
}) {
  return (
    <DocumentDialog
      {...props}
      document={document}
      onDelete={onDelete}
      focusField={focusField}
    />
  );
}
