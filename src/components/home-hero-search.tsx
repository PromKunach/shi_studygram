"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, FileText, Folder, Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { HomeAiButton } from "@/components/home-ai-button";
import { AiFormattedContent, AiFormattedParagraph } from "@/components/ai-formatted-text";
import { Input } from "@/components/ui/input";
import { requestAiAnswer } from "@/lib/ai/client";
import type { AiDocumentMatch } from "@/lib/ai/types";
import { searchDocumentsLocally } from "@/lib/document-search-client";
import { cn } from "@/lib/utils";

const AI_PLACEHOLDER = "ถามเกี่ยวกับเอกสาร หรือพิมพ์ชื่อวิชาเพื่อค้นหา";

type AiResponseState =
  | {
      kind: "text";
      text: string;
    }
  | {
      kind: "search";
      message: string;
      results: AiDocumentMatch[];
    }
  | null;

type DocumentSearchState = {
  message: string;
  results: AiDocumentMatch[];
} | null;

function AiPlaceholderText({ text }: { text: string }) {
  return (
    <span className="home-ai-search-placeholder text-sm text-muted">
      {text.split("").map((char, index) => (
        <motion.span
          key={index}
          className="inline-block"
          style={char === " " ? { width: "0.3em" } : undefined}
          initial={{ opacity: 0, y: 2 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.18,
            delay: index * 0.035,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </span>
  );
}

function AiSearchResultCard({
  document,
  index,
}: {
  document: AiDocumentMatch;
  index: number;
}) {
  const Icon = document.kind === "folder" ? Folder : FileText;

  return (
    <motion.li
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.24,
        delay: index * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <Link
        href={document.href}
        className="group flex h-full flex-col rounded-2xl border border-border bg-background p-3 shadow-sm transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-md"
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar text-muted transition-colors group-hover:bg-card group-hover:text-foreground">
            <Icon className="h-4 w-4" />
          </span>
          <span className="rounded-full bg-sidebar px-2 py-0.5 text-[10px] font-medium text-muted">
            {document.kind === "folder" ? "โฟลเดอร์" : "เอกสาร"}
          </span>
        </div>

        <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
          {document.title}
        </p>

        {document.sectionTitle ? (
          <p className="mt-1 line-clamp-1 text-xs text-muted">
            {document.sectionTitle}
          </p>
        ) : null}
      </Link>
    </motion.li>
  );
}

function AiSearchResults({
  message,
  results,
}: {
  message: string;
  results: AiDocumentMatch[];
}) {
  return (
    <div className="space-y-3">
      {message ? (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <AiFormattedContent text={message} />
        </motion.div>
      ) : null}

      {results.length > 0 ? (
        <motion.ul
          layout
          className="grid grid-cols-1 gap-2.5 sm:grid-cols-2"
          initial="hidden"
          animate="visible"
        >
          {results.map((document, index) => (
            <AiSearchResultCard
              key={document.id}
              document={document}
              index={index}
            />
          ))}
        </motion.ul>
      ) : null}
    </div>
  );
}

export function HomeHeroSearch() {
  const abortRef = useRef<AbortController | null>(null);
  const [aiActive, setAiActive] = useState(false);
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<AiResponseState>(null);
  const [normalSearch, setNormalSearch] = useState<DocumentSearchState>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const showAiPlaceholder = aiActive && query.length === 0 && !isGenerating;
  const canSend = aiActive && query.trim().length > 0 && !isGenerating;
  const canSearch = !aiActive && query.trim().length > 0 && !isSearching;
  const hasResponsePanel =
    aiActive && (response !== null || error !== null || isGenerating);
  const hasNormalSearchPanel =
    !aiActive && (normalSearch !== null || error !== null || isSearching);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const handleAiToggle = () => {
    setAiActive((current) => {
      const next = !current;
      if (!next) {
        abortRef.current?.abort();
        setResponse(null);
        setError(null);
        setIsGenerating(false);
      } else {
        setNormalSearch(null);
        setIsSearching(false);
        setError(null);
      }
      return next;
    });
  };

  const handleNormalSearch = async (trimmed: string) => {
    setIsSearching(true);
    setError(null);
    setNormalSearch(null);

    try {
      const result = await searchDocumentsLocally(trimmed);
      setNormalSearch(result);
    } catch {
      setError("ค้นหาไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = query.trim();
    if (!trimmed || isGenerating || isSearching) return;

    if (!aiActive) {
      await handleNormalSearch(trimmed);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsGenerating(true);
    setError(null);
    setResponse(null);

    try {
      const result = await requestAiAnswer({
        prompt: trimmed,
        signal: controller.signal,
        onTextChunk: (text) => {
          setResponse({ kind: "text", text });
        },
      });

      if (result.type === "search") {
        setResponse({
          kind: "search",
          message: result.message,
          results: result.results,
        });
      } else {
        setResponse({ kind: "text", text: result.text });
      }
    } catch (submitError) {
      if (controller.signal.aborted) return;
      setError(
        submitError instanceof Error
          ? submitError.message
          : "ไม่สามารถสร้างคำตอบได้"
      );
    } finally {
      if (!controller.signal.aborted) {
        setIsGenerating(false);
      }
    }
  };

  return (
    <div className="w-full">
      <form className="flex w-full items-center gap-2.5" onSubmit={handleSubmit}>
        <HomeAiButton
          active={aiActive}
          thinking={isGenerating}
          onToggle={handleAiToggle}
        />

        <div className="relative min-w-0 flex-1">
          {!aiActive ? (
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
          ) : null}
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={aiActive ? "" : "ค้นหา..."}
            className={cn(
              "h-10 rounded-full border-border bg-sidebar pr-11 shadow-none",
              aiActive ? "pl-3" : "pl-9"
            )}
            aria-label={aiActive ? "ถาม AI" : "ค้นหา"}
            disabled={isGenerating || isSearching}
          />
          {aiActive ? (
            <button
              type="submit"
              disabled={!canSend}
              aria-label="ส่ง"
              className={cn(
                "absolute top-1/2 right-1.5 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full transition-colors",
                canSend
                  ? "bg-foreground text-background hover:bg-foreground/90"
                  : "cursor-not-allowed bg-muted/50 text-muted"
              )}
            >
              <ArrowUp className="h-3.5 w-3.5" strokeWidth={2.25} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!canSearch}
              aria-label="ค้นหา"
              className={cn(
                "absolute top-1/2 right-1.5 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full transition-colors",
                canSearch
                  ? "bg-foreground text-background hover:bg-foreground/90"
                  : "cursor-not-allowed bg-muted/50 text-muted"
              )}
            >
              <Search className="h-3.5 w-3.5" strokeWidth={2.25} />
            </button>
          )}
          <AnimatePresence>
            {showAiPlaceholder ? (
              <motion.div
                key="ai-placeholder"
                className="pointer-events-none absolute inset-y-0 left-3 flex items-center overflow-hidden pr-12"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -4 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <AiPlaceholderText text={AI_PLACEHOLDER} />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </form>

      <AnimatePresence>
        {hasResponsePanel ? (
          <motion.div
            key="ai-response"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 rounded-2xl border border-border bg-card p-4 text-left shadow-sm"
          >
            {isGenerating && response === null ? (
              <p className="text-sm text-muted">กำลังคิด...</p>
            ) : null}

            {error ? (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            ) : null}

            {response?.kind === "search" ? (
              <AiSearchResults
                message={response.message}
                results={response.results}
              />
            ) : null}

            {response?.kind === "text" ? (
              <AiFormattedParagraph
                text={response.text}
                className={cn(isGenerating && "opacity-90")}
              />
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {hasNormalSearchPanel ? (
          <motion.div
            key="normal-search"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 rounded-2xl border border-border bg-card p-4 text-left shadow-sm"
          >
            {isSearching ? (
              <p className="text-sm text-muted">กำลังค้นหา...</p>
            ) : null}

            {error && !aiActive ? (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            ) : null}

            {normalSearch ? (
              <AiSearchResults
                message={normalSearch.message}
                results={normalSearch.results}
              />
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
