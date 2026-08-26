"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Redo2, Undo2 } from "lucide-react";
import {
  DocumentBlockEditor,
  type DocumentBlockEditorHandle,
} from "@/components/documents/document-block-editor";
import { GoogleDrivePreviewModal } from "@/components/documents/document-google-drive-inline";
import { getDocumentColorStyles } from "@/lib/document-colors";
import type { DocumentColorId } from "@/lib/document-colors";
import { getDocumentIcon, type DocumentIconId } from "@/lib/document-icons";
import {
  fetchDocumentNode,
  updateDocumentPage,
  type DocumentNodeRecord,
} from "@/lib/documents";
import { isDocumentNodeId } from "@/lib/document-ids";
import { PAGE_MAIN } from "@/lib/layout";
import { recordRecentPage } from "@/lib/recent-pages";
import { useCurrentUser } from "@/lib/userProfile";
import { cn } from "@/lib/utils";

type DocumentPageViewProps = {
  documentId: string;
};

type SaveState = "idle" | "saving" | "saved" | "error";

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

function autoResize(element: HTMLTextAreaElement | null) {
  if (!element) return;
  element.style.height = "auto";
  element.style.height = `${element.scrollHeight}px`;
}

export function DocumentPageView({ documentId }: DocumentPageViewProps) {
  const router = useRouter();
  const { ready } = useCurrentUser();

  const [node, setNode] = useState<DocumentNodeRecord | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const titleRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<DocumentBlockEditorHandle>(null);
  const toolbarSentinelRef = useRef<HTMLDivElement>(null);
  const hydratedRef = useRef(false);
  const lastSavedRef = useRef({ title: "", content: "" });
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isToolbarStuck, setIsToolbarStuck] = useState(false);

  const debouncedTitle = useDebouncedValue(title, 500);
  const debouncedContent = useDebouncedValue(content, 500);
  const isDebounceSynced =
    debouncedTitle === title && debouncedContent === content;

  const loadDocument = useCallback(async () => {
    setLoadError(null);
    setIsLoading(true);
    hydratedRef.current = false;

    if (!isDocumentNodeId(documentId)) {
      setNode(null);
      setLoadError("รหัสเอกสารไม่ถูกต้อง");
      setIsLoading(false);
      return;
    }

    try {
      const record = await fetchDocumentNode(documentId);

      if (!record) {
        setNode(null);
        setLoadError("ไม่พบเอกสาร");
        return;
      }

      if (record.kind !== "page") {
        setNode(record);
        setLoadError("รายการนี้เป็นโฟลเดอร์ ไม่ใช่เอกสาร");
        return;
      }

      setNode(record);
      setTitle(record.title);
      setContent(record.content ?? "");
      lastSavedRef.current = {
        title: record.title,
        content: record.content ?? "",
      };
      hydratedRef.current = true;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === "object" &&
              error !== null &&
              "message" in error &&
              typeof (error as { message: unknown }).message === "string"
            ? (error as { message: string }).message
            : "unknown error";
      console.error("Failed to load document", { documentId, message, error });
      setLoadError("โหลดเอกสารไม่สำเร็จ");
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    if (!ready) return;
    void loadDocument();
  }, [ready, loadDocument]);

  useEffect(() => {
    if (!node || node.kind !== "page") return;

    recordRecentPage({
      id: node.id,
      title: node.title.trim() || "ไม่มีชื่อ",
      href: `/documents/${node.id}`,
      iconId: node.icon,
      colorId: node.color,
    });
  }, [node]);

  useEffect(() => {
    autoResize(titleRef.current);
  }, [title, isLoading]);

  useEffect(() => {
    if (!hydratedRef.current || !node || node.kind !== "page") return;
    if (node.drive_url?.trim()) return;
    if (!isDebounceSynced) return;

    const nextTitle = debouncedTitle.trim() || "ไม่มีชื่อ";
    const nextContent = debouncedContent;
    const { title: savedTitle, content: savedContent } = lastSavedRef.current;

    if (nextTitle === savedTitle && nextContent === savedContent) return;

    const nodeId = node.id;
    let cancelled = false;

    const save = async () => {
      setSaveState("saving");

      try {
        const updated = await updateDocumentPage(nodeId, {
          title: nextTitle,
          content: nextContent,
        });

        if (cancelled) return;

        if (!updated) {
          setSaveState("error");
          return;
        }

        const savedContent = updated.content ?? nextContent;
        lastSavedRef.current = {
          title: updated.title,
          content: savedContent,
        };
        setContent(savedContent);
        setNode(updated);
        setSaveState("saved");
      } catch (error) {
        console.error(error);
        if (!cancelled) setSaveState("error");
      }
    };

    void save();

    return () => {
      cancelled = true;
    };
  }, [
    debouncedContent,
    debouncedTitle,
    isDebounceSynced,
    node?.id,
    node?.kind,
  ]);

  useEffect(() => {
    setCanUndo(false);
    setCanRedo(false);
    setIsToolbarStuck(false);
  }, [documentId]);

  useEffect(() => {
    if (saveState !== "saved") return;
    const timer = window.setTimeout(() => setSaveState("idle"), 2000);
    return () => window.clearTimeout(timer);
  }, [saveState]);

  useEffect(() => {
    const sentinel = toolbarSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsToolbarStuck(!entry?.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const Icon = getDocumentIcon((node?.icon ?? "file-text") as DocumentIconId);
  const colorStyles = getDocumentColorStyles(
    (node?.color ?? "none") as DocumentColorId
  );

  const isWorkspaceLoading = !ready || isLoading;
  const driveUrl =
    node?.kind === "page" ? node.drive_url?.trim() ?? "" : "";
  const isDriveLinkedPage = driveUrl.length > 0;

  return (
    <main className={cn(PAGE_MAIN, "pb-24")}>
      <article className="mx-auto w-full max-w-3xl">
        <div
          ref={toolbarSentinelRef}
          className="pointer-events-none h-px"
          aria-hidden
        />
        <div
          className={cn(
            "sticky top-0 z-20 -mx-4 mb-8 flex items-center justify-between gap-4 bg-background px-4 py-3",
            "sm:-mx-6 sm:px-6 md:-mx-10 md:px-10 lg:-mx-16 lg:px-16",
            isToolbarStuck && "border-b border-border shadow-sm"
          )}
        >
          <Link
            href="/documents"
            className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            เอกสาร
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            {!isWorkspaceLoading && !isDriveLinkedPage && saveState !== "idle" && (
              <p
                className={cn(
                  "mr-1 text-xs",
                  saveState === "error" ? "text-destructive" : "text-muted"
                )}
              >
                {saveState === "saving" && "กำลังบันทึก…"}
                {saveState === "saved" && "บันทึกแล้ว"}
                {saveState === "error" && "บันทึกไม่สำเร็จ"}
              </p>
            )}

            {!isDriveLinkedPage && (
              <>
                <button
                  type="button"
                  onClick={() => editorRef.current?.undo()}
                  disabled={!canUndo || isWorkspaceLoading}
                  aria-label="เลิกทำ"
                  className="inline-flex h-9 w-9 touch-manipulation items-center justify-center rounded-md text-foreground transition-colors hover:bg-hover disabled:pointer-events-none disabled:opacity-30"
                >
                  <Undo2 className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => editorRef.current?.redo()}
                  disabled={!canRedo || isWorkspaceLoading}
                  aria-label="ทำซ้ำ"
                  className="inline-flex h-9 w-9 touch-manipulation items-center justify-center rounded-md text-foreground transition-colors hover:bg-hover disabled:pointer-events-none disabled:opacity-30"
                >
                  <Redo2 className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {isWorkspaceLoading ? (
          <DocumentPageSkeleton />
        ) : loadError ? (
          <div className="rounded-2xl border border-dashed border-border bg-sidebar px-6 py-14 text-center">
            <p className="text-sm text-muted">{loadError}</p>
            <Link
              href="/documents"
              className="mt-4 inline-block text-sm font-medium text-foreground hover:underline"
            >
              กลับไปหน้าเอกสาร
            </Link>
          </div>
        ) : node && isDriveLinkedPage ? (
          <GoogleDrivePreviewModal
            open
            name={title || node.title}
            url={driveUrl}
            onClose={() => router.push("/documents")}
          />
        ) : node ? (
          <>
            <header className="mb-6">
              <div
                className="mb-4 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-xl"
                aria-hidden
              >
                <Icon
                  className="h-14 w-14"
                  strokeWidth={1.5}
                  style={
                    colorStyles.hasColor
                      ? { color: colorStyles.accent }
                      : undefined
                  }
                />
              </div>

              <label className="sr-only" htmlFor="document-title">
                ชื่อเอกสาร
              </label>
              <textarea
                ref={titleRef}
                id="document-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    editorRef.current?.focus();
                  }
                }}
                rows={1}
                placeholder="ไม่มีชื่อ"
                className="w-full resize-none overflow-hidden border-0 bg-transparent p-0 text-3xl font-bold leading-tight tracking-tight text-foreground outline-none placeholder:text-muted/60 sm:text-4xl md:text-[40px]"
              />
            </header>

            <DocumentBlockEditor
              ref={editorRef}
              content={content}
              onChange={setContent}
              onHistoryChange={(state) => {
                setCanUndo(state.canUndo);
                setCanRedo(state.canRedo);
              }}
              className="min-h-[50vh]"
            />
          </>
        ) : null}
      </article>
    </main>
  );
}

function DocumentPageSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-4 h-[4.5rem] w-[4.5rem] rounded-xl bg-hover" />
      <div className="mb-6 h-10 w-2/3 max-w-md rounded-lg bg-hover" />
      <div className="space-y-3">
        <div className="h-4 w-full rounded bg-hover" />
        <div className="h-4 w-full rounded bg-hover" />
        <div className="h-4 w-4/5 rounded bg-hover" />
      </div>
    </div>
  );
}
