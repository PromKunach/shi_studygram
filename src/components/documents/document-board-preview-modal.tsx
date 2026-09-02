"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  ExternalLink,
  Folder,
  Pencil,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { DocumentItem } from "@/components/documents/document-card";
import { DocumentCard } from "@/components/documents/document-card";
import { GoogleDrivePreviewModal } from "@/components/documents/document-google-drive-inline";
import {
  getDocumentOpenTarget,
  getNodeChildren,
  hasDocumentDriveLink,
  type DocumentNodeRecord,
  type DocumentOpenTarget,
} from "@/lib/documents";

type DocumentBoardPreviewModalProps = {
  documentId: string | null;
  nodes: DocumentNodeRecord[];
  items: DocumentItem[];
  open: boolean;
  onClose: () => void;
  onOpenTarget?: (target: DocumentOpenTarget) => void;
  onEditNode?: () => void;
};

function PreviewShell({
  title,
  icon,
  open,
  onClose,
  onBack,
  onEditNode,
  onOpen,
  openLabel,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  open: boolean;
  onClose: () => void;
  onBack?: () => void;
  onEditNode?: () => void;
  onOpen?: () => void;
  openLabel?: string;
  children: React.ReactNode;
}) {
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

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6">
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
            aria-label={`พรีวิว ${title}`}
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{
              type: "spring",
              stiffness: 380,
              damping: 28,
              mass: 0.8,
            }}
            className="relative flex h-[min(90vh,780px)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
          >
            <header className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
              {onBack ? (
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-hover"
                >
                  <ArrowLeft className="h-4 w-4" />
                  กลับ
                </button>
              ) : null}
              {icon}
              <h2 className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                {title}
              </h2>
              {onEditNode ? (
                <button
                  type="button"
                  onClick={onEditNode}
                  className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-hover"
                >
                  <Pencil className="h-3.5 w-3.5 text-muted" />
                  แก้ไข Node
                </button>
              ) : null}
              {onOpen ? (
                <button
                  type="button"
                  onClick={onOpen}
                  className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-hover"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-muted" />
                  {openLabel ?? "เปิดหน้าเต็ม"}
                </button>
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

            <div className="min-h-0 flex-1 overflow-hidden bg-sidebar">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function DocumentBoardPreviewModal({
  documentId,
  nodes,
  items,
  open,
  onClose,
  onOpenTarget,
  onEditNode,
}: DocumentBoardPreviewModalProps) {
  const [activeId, setActiveId] = useState<string | null>(documentId);
  const [parentFolderId, setParentFolderId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setActiveId(documentId);
      setParentFolderId(null);
    }
  }, [documentId, open]);

  const document = useMemo(
    () => items.find((item) => item.id === activeId) ?? null,
    [activeId, items]
  );

  const folderChildren = useMemo(() => {
    if (!document || document.type !== "folder") return [];
    return getNodeChildren(nodes, document.id);
  }, [document, nodes]);

  if (!open || !document) return null;

  if (hasDocumentDriveLink(document)) {
    return (
      <GoogleDrivePreviewModal
        open={open}
        name={document.title}
        url={document.driveUrl!.trim()}
        onClose={onClose}
      />
    );
  }

  const openTarget = getDocumentOpenTarget(document.id, nodes);
  const handleOpenFull = openTarget && onOpenTarget
    ? () => onOpenTarget(openTarget)
    : undefined;

  const handleEditNode = onEditNode
    ? () => {
        onClose();
        onEditNode();
      }
    : undefined;

  if (document.type === "folder") {
    return (
      <PreviewShell
        title={document.title}
        icon={<Folder className="h-5 w-5 shrink-0 text-muted" />}
        open={open}
        onClose={onClose}
        onEditNode={handleEditNode}
        onOpen={handleOpenFull}
        openLabel="เปิดโฟลเดอร์"
      >
        {folderChildren.length > 0 ? (
          <div className="h-full overflow-y-auto">
            <div className="flex flex-wrap gap-3 px-6 py-5">
              {folderChildren.map((child) => (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => {
                    setParentFolderId(document.id);
                    setActiveId(child.id);
                  }}
                  className="text-left"
                >
                  <DocumentCard document={child} />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="px-6 py-8 text-center text-sm text-muted-foreground">
            โฟลเดอร์นี้ยังว่างอยู่
          </p>
        )}
      </PreviewShell>
    );
  }

  return (
    <PreviewShell
      title={document.title}
      icon={null}
      open={open}
      onClose={onClose}
      onBack={
        parentFolderId
          ? () => {
              setActiveId(parentFolderId);
              setParentFolderId(null);
            }
          : undefined
      }
      onEditNode={handleEditNode}
      onOpen={handleOpenFull}
      openLabel="เปิดเอกสาร"
    >
      <iframe
        title={`พรีวิว ${document.title}`}
        src={`/documents/${document.id}?embed=1`}
        className="h-full w-full border-0 bg-background"
      />
    </PreviewShell>
  );
}
