"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { ExternalLink, Heading1, Heading2, Heading3, LayoutGrid, Link, List } from "lucide-react";
import { DocumentBoardEmbedBlock } from "@/components/documents/document-board-embed-block";
import {
  DocumentChipMenu,
  GoogleDriveFormPopover,
  GoogleDrivePreviewModal,
  GoogleDriveLogo,
} from "@/components/documents/document-google-drive-inline";
import {
  DocumentRichTextBlock,
  focusBlockAtOffset,
  getBlockCaretPosition,
  type DocumentRichTextBlockHandle,
} from "@/components/documents/document-rich-text-block";
import {
  createDocumentBlock,
  createDocumentBoardBlock,
  createDocumentInline,
  filterSlashCommands,
  insertInlineAtOffset,
  isBoardBlock,
  isBulletBlock,
  isHeadingBlock,
  isInlineSlashCommand,
  parseDocumentContent,
  removeInlineFromBlock,
  serializeDocumentContent,
  splitBlockAtOffset,
  wrapInlineMarkerLength,
  updateInlineInBlock,
  type DocumentBlock,
  type DocumentBlockType,
  type DocumentInlineType,
  type SlashCommand,
} from "@/lib/document-blocks";
import {
  canRedoDocumentEditor,
  canUndoDocumentEditor,
  clearDocumentEditorHistory,
  cloneDocumentBlocks,
  createDocumentEditorHistory,
  isDocumentRedoHotkey,
  isDocumentUndoHotkey,
  pushDocumentUndo,
  redoDocumentEditor,
  undoDocumentEditor,
  type DocumentEditorSnapshot,
} from "@/lib/document-history";
import { mergeBlockContentFromDom, stripInvisibleEditorText } from "@/lib/document-rich-text";
import { cn } from "@/lib/utils";

function flushBlockFromDom(
  blocks: DocumentBlock[],
  blockId: string,
  getRoot: (id: string) => HTMLDivElement | null | undefined
) {
  return mergeBlockContentFromDom(blocks, blockId, getRoot(blockId) ?? null);
}

const TYPING_HISTORY_GROUP_MS = 400;

export type DocumentEditorHistoryState = {
  canUndo: boolean;
  canRedo: boolean;
};

export type DocumentBlockEditorHandle = {
  focus: () => void;
  undo: () => void;
  redo: () => void;
};

type DocumentBlockEditorProps = {
  content: string;
  onChange: (content: string) => void;
  onHistoryChange?: (state: DocumentEditorHistoryState) => void;
  className?: string;
  readOnly?: boolean;
};

type SlashMenuState = {
  blockId: string;
  query: string;
  slashIndex: number;
  cursorPos: number;
  top: number;
  left: number;
  selectedIndex: number;
};

type DriveFormState = {
  blockId: string;
  insertOffset: number;
  top: number;
  left: number;
  kind: DocumentInlineType;
  editInlineId?: string;
  initialName?: string;
  initialUrl?: string;
};

type ChipMenuState = {
  blockId: string;
  inlineId: string;
  url: string;
  name: string;
  top: number;
  left: number;
};

type PreviewModalState = {
  blockId: string;
  inlineId: string;
  url: string;
  name: string;
};

const SLASH_MENU_WIDTH = 240;

function commandIcon(command: SlashCommand) {
  switch (command.id) {
    case "h1":
      return Heading1;
    case "h2":
      return Heading2;
    case "h3":
      return Heading3;
    case "link":
      return Link;
    case "bullet":
      return List;
    case "board":
      return LayoutGrid;
    default:
      return Heading1;
  }
}

function openExternalUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return;
  const href = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  window.open(href, "_blank", "noopener,noreferrer");
}

export const DocumentBlockEditor = forwardRef<
  DocumentBlockEditorHandle,
  DocumentBlockEditorProps
>(function DocumentBlockEditor(
  { content, onChange, onHistoryChange, className, readOnly = false },
  ref
) {
  const [blocks, setBlocks] = useState<DocumentBlock[]>(() =>
    parseDocumentContent(content)
  );
  const [slashMenu, setSlashMenu] = useState<SlashMenuState | null>(null);
  const [driveForm, setDriveForm] = useState<DriveFormState | null>(null);
  const [chipMenu, setChipMenu] = useState<ChipMenuState | null>(null);
  const [previewModal, setPreviewModal] = useState<PreviewModalState | null>(
    null
  );
  const blockRefs = useRef(new Map<string, DocumentRichTextBlockHandle>());
  const lastSerializedRef = useRef(content);
  const historyRef = useRef(createDocumentEditorHistory());
  const blocksRef = useRef(blocks);
  const typingBaselineRef = useRef<DocumentEditorSnapshot | null>(null);
  const typingTimerRef = useRef<number | undefined>(undefined);
  const restoringRef = useRef(false);
  const onHistoryChangeRef = useRef(onHistoryChange);
  const lastHistoryStateRef = useRef<DocumentEditorHistoryState>({
    canUndo: false,
    canRedo: false,
  });

  blocksRef.current = blocks;
  onHistoryChangeRef.current = onHistoryChange;

  const notifyHistory = useCallback(() => {
    const next: DocumentEditorHistoryState = {
      canUndo:
        canUndoDocumentEditor(historyRef.current) ||
        typingBaselineRef.current !== null,
      canRedo: canRedoDocumentEditor(historyRef.current),
    };
    const previous = lastHistoryStateRef.current;
    if (
      previous.canUndo === next.canUndo &&
      previous.canRedo === next.canRedo
    ) {
      return;
    }
    lastHistoryStateRef.current = next;
    onHistoryChangeRef.current?.(next);
  }, []);

  useEffect(() => {
    if (content === lastSerializedRef.current) return;

    setBlocks(parseDocumentContent(content));
    lastSerializedRef.current = content;
    clearDocumentEditorHistory(historyRef.current);
    typingBaselineRef.current = null;
    window.clearTimeout(typingTimerRef.current);
    lastHistoryStateRef.current = { canUndo: false, canRedo: false };
    onHistoryChangeRef.current?.({ canUndo: false, canRedo: false });
  }, [content]);

  useEffect(() => {
    return () => window.clearTimeout(typingTimerRef.current);
  }, []);

  useEffect(() => {
    const serialized = serializeDocumentContent(blocks);
    if (serialized === lastSerializedRef.current) return;

    lastSerializedRef.current = serialized;
    onChange(serialized);
  }, [blocks, onChange]);

  const emitChange = useCallback(
    (nextBlocks: DocumentBlock[]) => {
      setBlocks(nextBlocks);
      const serialized = serializeDocumentContent(nextBlocks);
      lastSerializedRef.current = serialized;
      onChange(serialized);
    },
    [onChange]
  );

  const snapshotCurrent = useCallback((): DocumentEditorSnapshot => {
    const active = document.activeElement;
    const blockRoot =
      active instanceof HTMLElement
        ? active.closest<HTMLElement>("[data-block-id]")
        : null;
    const blockId = blockRoot?.dataset.blockId;
    const focus = blockId
      ? {
          blockId,
          offset: getBlockCaretPosition(blockId)?.offset ?? 0,
        }
      : null;

    return {
      blocks: cloneDocumentBlocks(blocksRef.current),
      focus,
    };
  }, []);

  const commitTypingHistory = useCallback(() => {
    window.clearTimeout(typingTimerRef.current);
    const baseline = typingBaselineRef.current;
    if (!baseline) return;
    pushDocumentUndo(historyRef.current, baseline);
    typingBaselineRef.current = null;
    notifyHistory();
  }, [notifyHistory]);

  const noteTypingChange = useCallback(() => {
    if (restoringRef.current) return;
    if (!typingBaselineRef.current) {
      typingBaselineRef.current = snapshotCurrent();
    }
    window.clearTimeout(typingTimerRef.current);
    typingTimerRef.current = window.setTimeout(() => {
      commitTypingHistory();
    }, TYPING_HISTORY_GROUP_MS);
    notifyHistory();
  }, [commitTypingHistory, notifyHistory, snapshotCurrent]);

  const captureUndoSnapshot = useCallback(() => {
    if (restoringRef.current) return;
    commitTypingHistory();
    pushDocumentUndo(historyRef.current, snapshotCurrent());
    notifyHistory();
  }, [commitTypingHistory, notifyHistory, snapshotCurrent]);

  const restoreSnapshot = useCallback(
    (snapshot: DocumentEditorSnapshot) => {
      restoringRef.current = true;
      const nextBlocks = cloneDocumentBlocks(snapshot.blocks);
      emitChange(nextBlocks);
      setSlashMenu(null);
      setChipMenu(null);
      requestAnimationFrame(() => {
        if (snapshot.focus) {
          const focusedBlock = nextBlocks.find(
            (block) => block.id === snapshot.focus?.blockId
          );
          focusBlockAtOffset(
            snapshot.focus.blockId,
            Math.min(snapshot.focus.offset, focusedBlock?.text.length ?? 0)
          );
        } else {
          const first = nextBlocks[0];
          if (first) blockRefs.current.get(first.id)?.focus();
        }
        restoringRef.current = false;
      });
    },
    [emitChange]
  );

  const applyUndo = useCallback(() => {
    commitTypingHistory();
    const restored = undoDocumentEditor(
      historyRef.current,
      snapshotCurrent()
    );
    if (!restored) return;
    restoreSnapshot(restored);
    notifyHistory();
  }, [commitTypingHistory, notifyHistory, restoreSnapshot, snapshotCurrent]);

  const applyRedo = useCallback(() => {
    commitTypingHistory();
    const restored = redoDocumentEditor(
      historyRef.current,
      snapshotCurrent()
    );
    if (!restored) return;
    restoreSnapshot(restored);
    notifyHistory();
  }, [commitTypingHistory, notifyHistory, restoreSnapshot, snapshotCurrent]);

  useImperativeHandle(
    ref,
    () => ({
      focus() {
        const first = blocksRef.current[0];
        if (!first) return;
        blockRefs.current.get(first.id)?.focus();
      },
      undo: applyUndo,
      redo: applyRedo,
    }),
    [applyRedo, applyUndo]
  );

  const updateBlock = useCallback(
    (
      blockId: string,
      patch: Partial<DocumentBlock>,
      historyMode: "typing" | "structural" = "typing"
    ) => {
      if (historyMode === "structural") {
        captureUndoSnapshot();
      } else {
        noteTypingChange();
      }

      setBlocks((currentBlocks) =>
        currentBlocks.map((block) =>
          block.id === blockId ? { ...block, ...patch } : block
        )
      );
    },
    [captureUndoSnapshot, noteTypingChange]
  );

  const insertBlockAfter = useCallback(
    (
      blockId: string,
      type: DocumentBlockType = "paragraph",
      sourceBlocks = blocksRef.current
    ) => {
      const flushed = flushBlockFromDom(sourceBlocks, blockId, (id) =>
        blockRefs.current.get(id)?.getRoot()
      );
      const index = flushed.findIndex((block) => block.id === blockId);
      if (index === -1) return null;

      captureUndoSnapshot();
      const nextBlock = createDocumentBlock(type);
      const nextBlocks = [
        ...flushed.slice(0, index + 1),
        nextBlock,
        ...flushed.slice(index + 1),
      ];
      emitChange(nextBlocks);
      return nextBlock;
    },
    [captureUndoSnapshot, emitChange]
  );

  const handleBlockEnter = useCallback(
    (
      blockId: string,
      blockType: DocumentBlockType,
      payload: { empty: boolean; offset: number; textLength: number }
    ) => {
      const flushed = flushBlockFromDom(blocksRef.current, blockId, (id) =>
        blockRefs.current.get(id)?.getRoot()
      );
      const currentBlock = flushed.find((block) => block.id === blockId);
      if (!currentBlock) return;

      const isEmpty =
        stripInvisibleEditorText(currentBlock.text).length === 0 &&
        (currentBlock.inlines?.length ?? 0) === 0;

      if (isBulletBlock(blockType) && isEmpty) {
        const nextBlock = insertBlockAfter(blockId, "bullet", flushed);
        if (!nextBlock) return;
        requestAnimationFrame(() => {
          focusBlockAtOffset(nextBlock.id, 0);
        });
        return;
      }

      const nextType = isBulletBlock(blockType) ? "bullet" : "paragraph";

      if (payload.offset < currentBlock.text.length) {
        captureUndoSnapshot();
        const { before, after } = splitBlockAtOffset(
          currentBlock,
          payload.offset
        );
        const afterBlock = createDocumentBlock(nextType);
        afterBlock.text = after.text;
        afterBlock.inlines = after.inlines;

        const index = flushed.findIndex((block) => block.id === blockId);
        const nextBlocks = [
          ...flushed.slice(0, index),
          { ...currentBlock, ...before },
          afterBlock,
          ...flushed.slice(index + 1),
        ];
        emitChange(nextBlocks);

        const focusBlockId =
          payload.offset === 0 ? blockId : afterBlock.id;
        requestAnimationFrame(() => {
          focusBlockAtOffset(focusBlockId, 0);
        });
        return;
      }

      const nextBlock = insertBlockAfter(blockId, nextType, flushed);
      if (!nextBlock) return;
      requestAnimationFrame(() => {
        focusBlockAtOffset(nextBlock.id, 0);
      });
    },
    [captureUndoSnapshot, emitChange, insertBlockAfter]
  );

  const applySlashCommand = useCallback(
    (command: SlashCommand) => {
      if (!slashMenu) return;

      const block = blocks.find((item) => item.id === slashMenu.blockId);
      if (!block) return;

      const before = block.text.slice(0, slashMenu.slashIndex);
      const after = block.text.slice(slashMenu.cursorPos);
      const nextText = `${before}${after}`;

      if (isInlineSlashCommand(command.id)) {
        updateBlock(block.id, { text: nextText }, "structural");
        setSlashMenu(null);
        setDriveForm({
          blockId: block.id,
          insertOffset: slashMenu.slashIndex,
          top: slashMenu.top,
          left: slashMenu.left,
          kind: command.id,
        });
        requestAnimationFrame(() => {
          focusBlockAtOffset(block.id, slashMenu.slashIndex);
        });
        return;
      }

      if (command.id === "board") {
        captureUndoSnapshot();
        const index = blocks.findIndex((item) => item.id === block.id);
        const boardBlock = createDocumentBoardBlock();
        const afterBlock = createDocumentBlock();
        const nextBlocks = [...blocks];

        if (before.trim()) {
          nextBlocks[index] = { ...block, text: before };
          if (after.trim()) {
            afterBlock.text = after;
          }
          nextBlocks.splice(index + 1, 0, boardBlock, afterBlock);
        } else if (after.trim()) {
          nextBlocks[index] = boardBlock;
          afterBlock.text = after;
          nextBlocks.splice(index + 1, 0, afterBlock);
        } else {
          nextBlocks[index] = boardBlock;
          nextBlocks.splice(index + 1, 0, afterBlock);
        }

        emitChange(nextBlocks);
        setSlashMenu(null);
        return;
      }

      updateBlock(
        block.id,
        {
          type: command.id,
          text: nextText,
        },
        "structural"
      );
      setSlashMenu(null);

      requestAnimationFrame(() => {
        focusBlockAtOffset(block.id, before.length);
      });
    },
    [blocks, captureUndoSnapshot, emitChange, slashMenu, updateBlock]
  );

  const handleEmptyBlockBackspace = useCallback(
    (block: DocumentBlock) => {
      setSlashMenu(null);

      const flushed = flushBlockFromDom(blocksRef.current, block.id, (id) =>
        blockRefs.current.get(id)?.getRoot()
      );
      const currentBlock =
        flushed.find((item) => item.id === block.id) ?? block;

      if (isHeadingBlock(currentBlock.type) || isBulletBlock(currentBlock.type)) {
        captureUndoSnapshot();
        const nextBlocks = flushed.map((item) =>
          item.id === block.id
            ? { ...item, type: "paragraph" as const }
            : item
        );
        emitChange(nextBlocks);
        requestAnimationFrame(() => {
          focusBlockAtOffset(block.id, 0);
        });
        return;
      }

      if (isBoardBlock(currentBlock.type)) {
        if (flushed.length <= 1) return;

        const index = flushed.findIndex((item) => item.id === block.id);
        const focusTarget =
          index > 0 ? flushed[index - 1]! : flushed[index + 1]!;

        captureUndoSnapshot();
        emitChange(flushed.filter((item) => item.id !== block.id));

        requestAnimationFrame(() => {
          const target =
            flushed.find((item) => item.id === focusTarget.id) ?? focusTarget;
          focusBlockAtOffset(focusTarget.id, target.text.length);
        });
        return;
      }

      if (flushed.length <= 1) return;

      const index = flushed.findIndex((item) => item.id === block.id);
      const focusTarget =
        index > 0 ? flushed[index - 1]! : flushed[index + 1]!;

      captureUndoSnapshot();
      emitChange(flushed.filter((item) => item.id !== block.id));

      requestAnimationFrame(() => {
        const target =
          flushed.find((item) => item.id === focusTarget.id) ?? focusTarget;
        focusBlockAtOffset(focusTarget.id, target.text.length);
      });
    },
    [captureUndoSnapshot, emitChange]
  );

  const handleDriveFormSubmit = useCallback(
    (values: { name: string; url: string }) => {
      if (!driveForm) return;

      const block = blocks.find((item) => item.id === driveForm.blockId);
      if (!block) return;

      if (driveForm.editInlineId) {
        updateBlock(
          block.id,
          {
            ...updateInlineInBlock(block, driveForm.editInlineId, values),
          },
          "structural"
        );
        setDriveForm(null);
        requestAnimationFrame(() => blockRefs.current.get(block.id)?.focus());
        return;
      }

      const inline = createDocumentInline(
        driveForm.kind,
        values.url,
        values.name
      );
      const inserted = insertInlineAtOffset(
        block,
        driveForm.insertOffset,
        inline
      );

      updateBlock(block.id, inserted, "structural");
      setDriveForm(null);

      requestAnimationFrame(() => {
        focusBlockAtOffset(
          block.id,
          driveForm.insertOffset + wrapInlineMarkerLength(inline.id)
        );
      });
    },
    [blocks, driveForm, updateBlock]
  );

  const handleRemoveInline = useCallback(
    (blockId: string, inlineId: string) => {
      const block = blocks.find((item) => item.id === blockId);
      if (!block) return;
      updateBlock(blockId, removeInlineFromBlock(block, inlineId), "structural");
    },
    [blocks, updateBlock]
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        !(target instanceof HTMLElement) ||
        !target.closest("[data-block-id]")
      ) {
        return;
      }

      if (isDocumentRedoHotkey(event)) {
        event.preventDefault();
        event.stopPropagation();
        applyRedo();
        return;
      }

      if (isDocumentUndoHotkey(event)) {
        event.preventDefault();
        event.stopPropagation();
        applyUndo();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [applyRedo, applyUndo]);

  useEffect(() => {
    if (!slashMenu) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const filtered = filterSlashCommands(slashMenu.query);
      if (filtered.length === 0) return;

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        event.stopPropagation();
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        event.stopPropagation();
        setSlashMenu((current) =>
          current
            ? {
                ...current,
                selectedIndex: Math.min(
                  current.selectedIndex + 1,
                  filtered.length - 1
                ),
              }
            : current
        );
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        event.stopPropagation();
        setSlashMenu((current) =>
          current
            ? {
                ...current,
                selectedIndex: Math.max(current.selectedIndex - 1, 0),
              }
            : current
        );
      }

      if (event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        const selectedIndex = Math.min(
          slashMenu.selectedIndex,
          filtered.length - 1
        );
        const selected = filtered[selectedIndex] ?? filtered[0];
        if (selected) applySlashCommand(selected);
      }

      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        setSlashMenu(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [applySlashCommand, slashMenu]);

  useEffect(() => {
    if (!slashMenu) return;

    const closeOnOutside = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;

      const menu = document.getElementById("document-slash-menu");
      const activeRoot = blockRefs.current.get(slashMenu.blockId)?.getRoot();
      if (activeRoot?.contains(target) || menu?.contains(target)) return;
      setSlashMenu(null);
    };

    document.addEventListener("mousedown", closeOnOutside);
    return () => document.removeEventListener("mousedown", closeOnOutside);
  }, [slashMenu]);

  const filteredCommands = slashMenu
    ? filterSlashCommands(slashMenu.query)
    : [];
  const selectedCommandIndex = slashMenu
    ? Math.min(
        slashMenu.selectedIndex,
        Math.max(filteredCommands.length - 1, 0)
      )
    : 0;

  return (
    <div className={cn("space-y-1", className)}>
      {blocks.map((block, index) => {
        if (isBoardBlock(block.type)) {
          return (
            <DocumentBoardEmbedBlock
              key={block.id}
              boardId={block.boardId ?? null}
              boardName={block.boardName ?? ""}
              readOnly={readOnly}
              onChange={(patch) =>
                updateBlock(block.id, patch, "structural")
              }
              onRemove={() => {
                captureUndoSnapshot();
                const nextBlocks = blocks.filter((item) => item.id !== block.id);
                emitChange(
                  nextBlocks.length > 0 ? nextBlocks : [createDocumentBlock()]
                );
              }}
            />
          );
        }

        return (
        <div
          key={block.id}
          className={cn(
            "flex items-start gap-2",
            block.type === "bullet" ? "pl-0.5" : undefined
          )}
        >
          {block.type === "bullet" ? (
            <span
              aria-hidden
              className="mt-[0.7em] h-1.5 w-1.5 shrink-0 rounded-full bg-foreground"
            />
          ) : null}
          <DocumentRichTextBlock
            ref={(element) => {
              if (element) blockRefs.current.set(block.id, element);
              else blockRefs.current.delete(block.id);
            }}
            block={block}
            slashMenuActive={slashMenu?.blockId === block.id}
            className="min-w-0 flex-1"
            placeholder={
              index === 0 && block.type === "paragraph"
                ? "เริ่มพิมพ์ได้เลย หรือพิมพ์ / เพื่อเพิ่มบล็อก"
                : undefined
            }
            onChange={(patch) =>
              updateBlock(block.id, {
                text: patch.text,
                inlines: patch.inlines,
              })
            }
            onEnter={(payload) =>
              handleBlockEnter(block.id, block.type, payload)
            }
            onEmptyBackspace={() => handleEmptyBlockBackspace(block)}
            onSlashSync={(payload) => {
              if (driveForm?.blockId === block.id) return;
              setSlashMenu((current) => {
                const queryChanged = current?.query !== payload.query;
                const blockChanged = current?.blockId !== block.id;
                const filtered = filterSlashCommands(payload.query);
                const preservedIndex =
                  blockChanged || queryChanged
                    ? 0
                    : (current?.selectedIndex ?? 0);

                return {
                  blockId: block.id,
                  ...payload,
                  selectedIndex: Math.min(
                    preservedIndex,
                    Math.max(filtered.length - 1, 0)
                  ),
                };
              });
            }}
            onSlashDismiss={() => {
              setSlashMenu((current) =>
                current?.blockId === block.id ? null : current
              );
            }}
            onInlineClick={(payload) => {
              setChipMenu(null);
              if (payload.inlineType === "link") {
                setChipMenu({
                  blockId: block.id,
                  inlineId: payload.inlineId,
                  url: payload.url,
                  name: payload.name,
                  top: payload.top,
                  left: payload.left,
                });
                return;
              }

              setPreviewModal({
                blockId: block.id,
                inlineId: payload.inlineId,
                url: payload.url,
                name: payload.name,
              });
            }}
            onRemoveInline={(inlineId) =>
              handleRemoveInline(block.id, inlineId)
            }
          />
        </div>
        );
      })}

      <GoogleDriveFormPopover
        open={driveForm !== null}
        top={driveForm?.top ?? 0}
        left={driveForm?.left ?? 0}
        kind={driveForm?.kind ?? "google-drive"}
        initialValues={
          driveForm
            ? {
                name: driveForm.initialName ?? "",
                url: driveForm.initialUrl ?? "",
              }
            : undefined
        }
        title={
          driveForm?.kind === "link"
            ? driveForm.editInlineId
              ? "แก้ไขลิงก์"
              : "Link"
            : driveForm?.editInlineId
              ? "แก้ไข Google Drive"
              : "Google Drive"
        }
        urlPlaceholder={
          driveForm?.kind === "link" ? "https://" : "ลิงก์ Google Drive"
        }
        onClose={() => setDriveForm(null)}
        onSubmit={handleDriveFormSubmit}
      />

      <DocumentChipMenu
        open={chipMenu !== null}
        top={chipMenu?.top ?? 0}
        left={chipMenu?.left ?? 0}
        secondaryLabel="Open link"
        SecondaryIcon={ExternalLink}
        onClose={() => setChipMenu(null)}
        onEdit={() => {
          if (!chipMenu) return;
          setDriveForm({
            blockId: chipMenu.blockId,
            insertOffset: 0,
            top: chipMenu.top,
            left: chipMenu.left,
            kind: "link",
            editInlineId: chipMenu.inlineId,
            initialName: chipMenu.name,
            initialUrl: chipMenu.url,
          });
        }}
        onSecondary={() => {
          if (!chipMenu) return;
          openExternalUrl(chipMenu.url);
        }}
      />

      <GoogleDrivePreviewModal
        open={previewModal !== null}
        name={previewModal?.name ?? ""}
        url={previewModal?.url ?? ""}
        onClose={() => setPreviewModal(null)}
        onEdit={
          previewModal
            ? () => {
                setPreviewModal(null);
                setDriveForm({
                  blockId: previewModal.blockId,
                  insertOffset: 0,
                  top: window.innerHeight / 2,
                  left: window.innerWidth / 2,
                  kind: "google-drive",
                  editInlineId: previewModal.inlineId,
                  initialName: previewModal.name,
                  initialUrl: previewModal.url,
                });
              }
            : undefined
        }
      />

      {slashMenu &&
        filteredCommands.length > 0 &&
        createPortal(
          <div
            id="document-slash-menu"
            role="listbox"
            className="fixed z-50 overflow-hidden rounded-xl border border-border bg-background shadow-lg"
            style={{
              top: slashMenu.top,
              left: slashMenu.left,
              width: SLASH_MENU_WIDTH,
            }}
          >
            <p className="border-b border-border px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted">
              บล็อก
            </p>
            <ul className="max-h-56 overflow-y-auto p-1">
              {filteredCommands.map((command, index) => {
                const Icon = commandIcon(command);
                const selected = index === selectedCommandIndex;
                const isGoogleDrive = command.id === "google-drive";

                return (
                  <li key={command.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => applySlashCommand(command)}
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors",
                        selected ? "bg-hover" : "hover:bg-hover"
                      )}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-sidebar text-muted">
                        {isGoogleDrive ? (
                          <GoogleDriveLogo className="h-4 w-4" />
                        ) : (
                          <Icon className="h-4 w-4" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-foreground">
                          {command.label}
                        </span>
                        <span className="block text-xs text-muted">
                          {command.description}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>,
          document.body
        )}
    </div>
  );
});
