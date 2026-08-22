"use client";

import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from "react";
import {
  blockTypeClassName,
  detectSlashTrigger,
  type DocumentBlock,
  type DocumentInline,
  type DocumentInlineType,
} from "@/lib/document-blocks";
import {
  getPlainTextBeforeCursor,
  getSelectionCaretRect,
  getSelectionTextOffset,
  handleInlineBackspace,
  isRichTextEmpty,
  placeCursorAtTextOffset,
  removeInlineNode,
  serializeBlock,
  serializeRichTextRoot,
  syncRichTextDom,
} from "@/lib/document-rich-text";
import { cn } from "@/lib/utils";

export type DocumentRichTextBlockHandle = {
  focus: () => void;
  getRoot: () => HTMLDivElement | null;
};

type DocumentRichTextBlockProps = {
  block: DocumentBlock;
  slashMenuActive?: boolean;
  placeholder?: string;
  className?: string;
  onChange: (patch: { text: string; inlines: DocumentInline[] }) => void;
  onEnter: (payload: {
    empty: boolean;
    offset: number;
    textLength: number;
  }) => void;
  onEmptyBackspace: () => void;
  onSlashSync: (payload: {
    query: string;
    slashIndex: number;
    cursorPos: number;
    top: number;
    left: number;
  }) => void;
  onSlashDismiss: () => void;
  onInlineClick: (payload: {
    inlineId: string;
    url: string;
    name: string;
    inlineType: DocumentInlineType;
    top: number;
    left: number;
  }) => void;
  onRemoveInline: (inlineId: string) => void;
};

export const DocumentRichTextBlock = forwardRef<
  DocumentRichTextBlockHandle,
  DocumentRichTextBlockProps
>(function DocumentRichTextBlock(
  {
    block,
    slashMenuActive = false,
    placeholder,
    className,
    onChange,
    onEnter,
    onEmptyBackspace,
    onSlashSync,
    onSlashDismiss,
    onInlineClick,
    onRemoveInline,
  },
  ref
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const isFocusedRef = useRef(false);
  const lastSerializedRef = useRef("");

  useImperativeHandle(ref, () => ({
    focus() {
      rootRef.current?.focus();
    },
    getRoot() {
      return rootRef.current;
    },
  }));

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const target = serializeBlock(block);
    if (target === lastSerializedRef.current) return;

    const current = JSON.stringify(serializeRichTextRoot(root));
    if (current === target) {
      lastSerializedRef.current = target;
      return;
    }

    const shouldRestoreCursor =
      isFocusedRef.current || root.contains(document.activeElement);
    const cursorOffset = shouldRestoreCursor
      ? getSelectionTextOffset(root)
      : null;

    syncRichTextDom(root, block);
    lastSerializedRef.current = target;

    if (cursorOffset !== null) {
      placeCursorAtTextOffset(root, cursorOffset);
    }
  }, [block]);

  const emitChange = () => {
    const root = rootRef.current;
    if (!root) return;

    const next = serializeRichTextRoot(root);
    lastSerializedRef.current = JSON.stringify({
      text: next.text,
      inlines: next.inlines,
    });
    onChange(next);
  };

  const syncSlashMenu = () => {
    const root = rootRef.current;
    if (!root) return;

    const textBefore = getPlainTextBeforeCursor(root);
    const cursorPos = textBefore.length;
    const trigger = detectSlashTrigger(textBefore, cursorPos);

    if (!trigger) {
      onSlashDismiss();
      return;
    }

    const caret = getSelectionCaretRect();
    if (!caret) return;

    onSlashSync({
      query: trigger.query,
      slashIndex: trigger.slashIndex,
      cursorPos,
      top: caret.top + 20,
      left: caret.left,
    });
  };

  return (
    <div
      ref={rootRef}
      contentEditable
      suppressContentEditableWarning
      data-block-id={block.id}
      onFocus={() => {
        isFocusedRef.current = true;
      }}
      onBlur={() => {
        isFocusedRef.current = false;
      }}
      onInput={() => {
        emitChange();
        syncSlashMenu();
      }}
      onClick={(event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
          syncSlashMenu();
          return;
        }

        const chip = target.closest<HTMLElement>("[data-inline-id]");
        if (chip?.dataset.inlineId) {
          event.preventDefault();
          event.stopPropagation();
          const rect = chip.getBoundingClientRect();
          onInlineClick({
            inlineId: chip.dataset.inlineId,
            url: chip.dataset.driveUrl ?? "",
            name: chip.dataset.driveName ?? "",
            inlineType:
              chip.dataset.inlineType === "link" ? "link" : "google-drive",
            top: rect.bottom + 6,
            left: rect.left,
          });
          return;
        }

        syncSlashMenu();
      }}
      onKeyUp={() => {
        syncSlashMenu();
      }}
      onKeyDown={(event) => {
        const root = rootRef.current;
        if (!root) return;

        if (event.key === "Enter" && !event.shiftKey) {
          if (slashMenuActive) {
            event.preventDefault();
            return;
          }
          event.preventDefault();
          const offset = getSelectionTextOffset(root);
          const { text } = serializeRichTextRoot(root);
          onEnter({
            empty: isRichTextEmpty(root),
            offset,
            textLength: text.length,
          });
          return;
        }

        if (event.key === "Backspace") {
          const inlineId = handleInlineBackspace(root);
          if (inlineId) {
            event.preventDefault();
            removeInlineNode(root, inlineId);
            emitChange();
            return;
          }

          if (isRichTextEmpty(root)) {
            event.preventDefault();
            onEmptyBackspace();
          }
        }
      }}
      data-placeholder={placeholder}
      className={cn(
        "min-h-[1.6em] w-full whitespace-pre-wrap break-words outline-none transition-[font-size,line-height,font-weight] duration-150 ease-out empty:before:text-muted/60 empty:before:content-[attr(data-placeholder)]",
        blockTypeClassName(block.type),
        className
      )}
      aria-label={
        block.type === "paragraph"
          ? "ย่อหน้า"
          : block.type === "bullet"
            ? "รายการจุด"
            : `หัวข้อ ${block.type.slice(1)}`
      }
    />
  );
});

export function getBlockCaretPosition(blockId: string) {
  const root = document.querySelector<HTMLDivElement>(
    `[data-block-id="${blockId}"]`
  );
  if (!root) return null;

  return {
    offset: getSelectionTextOffset(root),
    caret: getSelectionCaretRect(),
  };
}

export function focusBlockAtOffset(blockId: string, offset: number) {
  const root = document.querySelector<HTMLDivElement>(
    `[data-block-id="${blockId}"]`
  );
  if (!root) return;

  root.focus();
  placeCursorAtTextOffset(root, offset);
}
