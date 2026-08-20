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
import { Heading1, Heading2, Heading3 } from "lucide-react";
import {
  GoogleDriveFormPopover,
  GoogleDrivePreviewModal,
  GoogleDriveLogo,
} from "@/components/documents/document-google-drive-inline";
import {
  DocumentRichTextBlock,
  focusBlockAtOffset,
  type DocumentRichTextBlockHandle,
} from "@/components/documents/document-rich-text-block";
import {
  createDocumentBlock,
  createGoogleDriveInline,
  filterSlashCommands,
  insertInlineAtOffset,
  isHeadingBlock,
  parseDocumentContent,
  removeInlineFromBlock,
  serializeDocumentContent,
  wrapInlineMarkerLength,
  updateInlineInBlock,
  type DocumentBlock,
  type DocumentBlockType,
  type SlashCommand,
} from "@/lib/document-blocks";
import { cn } from "@/lib/utils";

export type DocumentBlockEditorHandle = {
  focus: () => void;
};

type DocumentBlockEditorProps = {
  content: string;
  onChange: (content: string) => void;
  className?: string;
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
  editInlineId?: string;
  initialName?: string;
  initialUrl?: string;
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
    default:
      return Heading1;
  }
}

export const DocumentBlockEditor = forwardRef<
  DocumentBlockEditorHandle,
  DocumentBlockEditorProps
>(function DocumentBlockEditor({ content, onChange, className }, ref) {
  const [blocks, setBlocks] = useState<DocumentBlock[]>(() =>
    parseDocumentContent(content)
  );
  const [slashMenu, setSlashMenu] = useState<SlashMenuState | null>(null);
  const [driveForm, setDriveForm] = useState<DriveFormState | null>(null);
  const [previewModal, setPreviewModal] = useState<PreviewModalState | null>(
    null
  );
  const blockRefs = useRef(new Map<string, DocumentRichTextBlockHandle>());
  const lastSerializedRef = useRef(content);

  useImperativeHandle(ref, () => ({
    focus() {
      const first = blocks[0];
      if (!first) return;
      blockRefs.current.get(first.id)?.focus();
    },
  }));

  useEffect(() => {
    if (content === lastSerializedRef.current) return;

    setBlocks(parseDocumentContent(content));
    lastSerializedRef.current = content;
  }, [content]);

  useEffect(() => {
    const serialized = serializeDocumentContent(blocks);
    if (serialized === lastSerializedRef.current) return;

    lastSerializedRef.current = serialized;
    onChange(serialized);
  }, [blocks, onChange]);

  const updateBlock = useCallback(
    (blockId: string, patch: Partial<DocumentBlock>) => {
      setBlocks((currentBlocks) =>
        currentBlocks.map((block) =>
          block.id === blockId ? { ...block, ...patch } : block
        )
      );
    },
    []
  );

  const emitChange = useCallback(
    (nextBlocks: DocumentBlock[]) => {
      setBlocks(nextBlocks);
      const serialized = serializeDocumentContent(nextBlocks);
      lastSerializedRef.current = serialized;
      onChange(serialized);
    },
    [onChange]
  );

  const insertBlockAfter = useCallback(
    (blockId: string, type: DocumentBlockType = "paragraph") => {
      const index = blocks.findIndex((block) => block.id === blockId);
      if (index === -1) return null;

      const nextBlock = createDocumentBlock(type);
      const nextBlocks = [
        ...blocks.slice(0, index + 1),
        nextBlock,
        ...blocks.slice(index + 1),
      ];
      emitChange(nextBlocks);
      return nextBlock;
    },
    [blocks, emitChange]
  );

  const removeBlock = useCallback(
    (blockId: string) => {
      if (blocks.length <= 1) {
        emitChange([createDocumentBlock()]);
        return;
      }

      emitChange(blocks.filter((block) => block.id !== blockId));
    },
    [blocks, emitChange]
  );

  const applySlashCommand = useCallback(
    (command: SlashCommand) => {
      if (!slashMenu) return;

      const block = blocks.find((item) => item.id === slashMenu.blockId);
      if (!block) return;

      const before = block.text.slice(0, slashMenu.slashIndex);
      const after = block.text.slice(slashMenu.cursorPos);
      const nextText = `${before}${after}`;

      if (command.id === "google-drive") {
        updateBlock(block.id, { text: nextText });
        setSlashMenu(null);
        setDriveForm({
          blockId: block.id,
          insertOffset: slashMenu.slashIndex,
          top: slashMenu.top,
          left: slashMenu.left,
        });
        requestAnimationFrame(() => {
          focusBlockAtOffset(block.id, slashMenu.slashIndex);
        });
        return;
      }

      updateBlock(block.id, {
        type: command.id,
        text: nextText,
      });
      setSlashMenu(null);

      requestAnimationFrame(() => {
        focusBlockAtOffset(block.id, before.length);
      });
    },
    [blocks, slashMenu, updateBlock]
  );

  const handleEmptyBlockBackspace = useCallback(
    (block: DocumentBlock) => {
      setSlashMenu(null);

      if (isHeadingBlock(block.type)) {
        updateBlock(block.id, { type: "paragraph" });
        requestAnimationFrame(() => blockRefs.current.get(block.id)?.focus());
        return;
      }

      if (blocks.length <= 1) return;

      const index = blocks.findIndex((item) => item.id === block.id);
      const focusTarget =
        index > 0 ? blocks[index - 1]! : blocks[index + 1]!;

      removeBlock(block.id);

      requestAnimationFrame(() => {
        blockRefs.current.get(focusTarget.id)?.focus();
      });
    },
    [blocks, removeBlock, updateBlock]
  );

  const handleDriveFormSubmit = useCallback(
    (values: { name: string; url: string }) => {
      if (!driveForm) return;

      const block = blocks.find((item) => item.id === driveForm.blockId);
      if (!block) return;

      if (driveForm.editInlineId) {
        updateBlock(block.id, {
          ...updateInlineInBlock(block, driveForm.editInlineId, values),
        });
        setDriveForm(null);
        requestAnimationFrame(() => blockRefs.current.get(block.id)?.focus());
        return;
      }

      const inline = createGoogleDriveInline(values.url, values.name);
      const inserted = insertInlineAtOffset(
        block,
        driveForm.insertOffset,
        inline
      );

      updateBlock(block.id, inserted);
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
      updateBlock(blockId, removeInlineFromBlock(block, inlineId));
    },
    [blocks, updateBlock]
  );

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
      {blocks.map((block, index) => (
        <DocumentRichTextBlock
          key={block.id}
          ref={(element) => {
            if (element) blockRefs.current.set(block.id, element);
            else blockRefs.current.delete(block.id);
          }}
          block={block}
          slashMenuActive={slashMenu?.blockId === block.id}
          placeholder={
            index === 0
              ? "เริ่มพิมพ์ได้เลย หรือพิมพ์ / เพื่อเพิ่มบล็อก"
              : undefined
          }
          onChange={(patch) =>
            updateBlock(block.id, {
              text: patch.text,
              inlines: patch.inlines,
            })
          }
          onEnter={() => {
            const nextBlock = insertBlockAfter(block.id);
            if (!nextBlock) return;
            requestAnimationFrame(() =>
              blockRefs.current.get(nextBlock.id)?.focus()
            );
          }}
          onEmptyBackspace={() => handleEmptyBlockBackspace(block)}
          onSlashSync={(payload) => {
            if (driveForm?.blockId === block.id) return;
            setSlashMenu((current) => {
              const queryChanged = current?.query !== payload.query;
              const blockChanged = current?.blockId !== block.id;
              const filtered = filterSlashCommands(payload.query);
              const preservedIndex =
                blockChanged || queryChanged ? 0 : (current?.selectedIndex ?? 0);

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
            setPreviewModal({
              blockId: block.id,
              inlineId: payload.inlineId,
              url: payload.url,
              name: payload.name,
            });
          }}
          onRemoveInline={(inlineId) => handleRemoveInline(block.id, inlineId)}
        />
      ))}

      <GoogleDriveFormPopover
        open={driveForm !== null}
        top={driveForm?.top ?? 0}
        left={driveForm?.left ?? 0}
        initialValues={
          driveForm
            ? {
                name: driveForm.initialName ?? "",
                url: driveForm.initialUrl ?? "",
              }
            : undefined
        }
        title={driveForm?.editInlineId ? "แก้ไข Google Drive" : "Google Drive"}
        onClose={() => setDriveForm(null)}
        onSubmit={handleDriveFormSubmit}
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
