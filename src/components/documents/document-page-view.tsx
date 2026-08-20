"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import {
  DocumentBlockEditor,
  type DocumentBlockEditorHandle,
} from "@/components/documents/document-block-editor";
import { getDocumentColorStyles } from "@/lib/document-colors";
import type { DocumentColorId } from "@/lib/document-colors";
import { getDocumentIcon, type DocumentIconId } from "@/lib/document-icons";
import {
  fetchDocumentNode,
  updateDocumentPage,
  type DocumentNodeRecord,
} from "@/lib/documents";
import { PAGE_MAIN } from "@/lib/layout";
import { getAuthorPbriId, useCurrentUser } from "@/lib/userProfile";
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
  const { user, ready } = useCurrentUser();
  const authorPbriId = getAuthorPbriId(user);

  const [node, setNode] = useState<DocumentNodeRecord | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const titleRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<DocumentBlockEditorHandle>(null);
  const hydratedRef = useRef(false);
  const lastSavedRef = useRef({ title: "", content: "" });

  const debouncedTitle = useDebouncedValue(title, 500);
  const debouncedContent = useDebouncedValue(content, 500);
  const isDebounceSynced =
    debouncedTitle === title && debouncedContent === content;

  const loadDocument = useCallback(async () => {
    setLoadError(null);
    setIsLoading(true);
    hydratedRef.current = false;

    try {
      const record = await fetchDocumentNode(authorPbriId, documentId);

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
      console.error(error);
      setLoadError("โหลดเอกสารไม่สำเร็จ");
    } finally {
      setIsLoading(false);
    }
  }, [authorPbriId, documentId]);

  useEffect(() => {
    if (!ready) return;
    void loadDocument();
  }, [ready, loadDocument]);

  useEffect(() => {
    autoResize(titleRef.current);
  }, [title, isLoading]);

  useEffect(() => {
    if (!hydratedRef.current || !node || node.kind !== "page") return;
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
        const updated = await updateDocumentPage(authorPbriId, nodeId, {
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
    authorPbriId,
    debouncedContent,
    debouncedTitle,
    isDebounceSynced,
    node?.id,
    node?.kind,
  ]);

  useEffect(() => {
    if (saveState !== "saved") return;
    const timer = window.setTimeout(() => setSaveState("idle"), 2000);
    return () => window.clearTimeout(timer);
  }, [saveState]);

  const Icon = getDocumentIcon((node?.icon ?? "file-text") as DocumentIconId);
  const colorStyles = getDocumentColorStyles(
    (node?.color ?? "none") as DocumentColorId
  );

  const isWorkspaceLoading = !ready || isLoading;

  return (
    <main className={cn(PAGE_MAIN, "pb-24")}>
      <article className="mx-auto w-full max-w-3xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link
            href="/documents"
            className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            เอกสาร
          </Link>

          {!isWorkspaceLoading && saveState !== "idle" && (
            <p
              className={cn(
                "text-xs",
                saveState === "error" ? "text-destructive" : "text-muted"
              )}
            >
              {saveState === "saving" && "กำลังบันทึก…"}
              {saveState === "saved" && "บันทึกแล้ว"}
              {saveState === "error" && "บันทึกไม่สำเร็จ"}
            </p>
          )}
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
