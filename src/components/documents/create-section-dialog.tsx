"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CreateSectionDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
};

export function CreateSectionDialog({
  open,
  onClose,
  onSubmit,
}: CreateSectionDialogProps) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (!open) return;
    setName("");
  }, [open]);

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
  }, [open, onClose]);

  const trimmed = name.trim();
  const canSubmit = trimmed.length > 0;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
            aria-labelledby="create-section-title"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 28, mass: 0.8 }}
            className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-xl"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2
                  id="create-section-title"
                  className="text-lg font-semibold text-foreground"
                >
                  สร้างส่วนใหม่
                </h2>
                <p className="mt-1 text-sm text-muted">ตั้งชื่อส่วนสำหรับจัดกลุ่มเอกสาร</p>
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

            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (!canSubmit) return;
                onSubmit(trimmed);
                onClose();
              }}
              className="space-y-5"
            >
              <div className="space-y-2">
                <Label htmlFor="section-name">ชื่อส่วน</Label>
                <Input
                  id="section-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="เช่น วิชาคณิตศาสตร์, โน้ตทั่วไป"
                  className="h-10 bg-sidebar shadow-none mt-3"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={onClose}>
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  variant="outline"
                  className="border-border bg-white text-black hover:bg-hover dark:bg-white dark:hover:bg-white/90"
                  disabled={!canSubmit}
                >
                  สร้างส่วน
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
