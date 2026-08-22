import {
  INLINE_EDGE_SPACE,
  inlineMarker,
  wrapInlineMarker,
  splitTextWithInlineMarkers,
  type DocumentBlock,
  type DocumentInline,
} from "@/lib/document-blocks";
import { createInlineChipElement } from "@/components/documents/document-google-drive-inline";

export const CURSOR_GAP = "\u2009";

function isInlineChipNode(node: ChildNode | null | undefined) {
  return node instanceof HTMLElement && Boolean(node.dataset.inlineId);
}

function normalizeDomTextForStorage(
  value: string,
  prevIsChip: boolean,
  nextIsChip: boolean
) {
  if (!value) return "";
  if (value === CURSOR_GAP && (prevIsChip || nextIsChip)) return "";
  return value;
}

export function serializeRichTextRoot(root: HTMLElement): {
  text: string;
  inlines: DocumentInline[];
} {
  let text = "";
  const inlines: DocumentInline[] = [];
  const children = [...root.childNodes];

  for (let index = 0; index < children.length; index += 1) {
    const node = children[index]!;

    if (node.nodeType === Node.TEXT_NODE) {
      const value = normalizeDomTextForStorage(
        node.textContent ?? "",
        isInlineChipNode(children[index - 1]),
        isInlineChipNode(children[index + 1])
      );
      if (value) text += value;
      continue;
    }

    if (!(node instanceof HTMLElement)) continue;

    if (node.tagName === "BR") {
      text += "\n";
      continue;
    }

    const inlineId = node.dataset.inlineId;
    if (inlineId) {
      const inlineType =
        node.dataset.inlineType === "link" ? "link" : "google-drive";
      text += wrapInlineMarker(inlineId);
      inlines.push({
        id: inlineId,
        type: inlineType,
        url: node.dataset.driveUrl ?? "",
        name: node.dataset.driveName ?? "",
      });
      continue;
    }

    text += node.textContent ?? "";
  }

  return { text, inlines };
}

export function serializeBlock(block: DocumentBlock) {
  return JSON.stringify({
    text: block.text,
    inlines: block.inlines ?? [],
  });
}

function displayTextForSegment(
  value: string,
  prevIsInline: boolean,
  nextIsInline: boolean
) {
  let text = value;
  if (prevIsInline) {
    text = text.startsWith(INLINE_EDGE_SPACE)
      ? text.slice(INLINE_EDGE_SPACE.length)
      : text;
  }
  if (nextIsInline) {
    text = text.endsWith(INLINE_EDGE_SPACE)
      ? text.slice(0, -INLINE_EDGE_SPACE.length)
      : text;
  }
  return text;
}

function getNodeStoredLength(node: ChildNode) {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent?.length ?? 0;
  }

  if (node instanceof HTMLElement) {
    if (node.tagName === "BR") return 1;
    if (node.dataset.inlineId) {
      return wrapInlineMarker(node.dataset.inlineId).length;
    }
  }

  return node.textContent?.length ?? 0;
}

function setCollapsedSelection(node: Node, offset: number) {
  const range = document.createRange();
  range.setStart(node, offset);
  range.collapse(true);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

function ensureTextNodeAfter(node: ChildNode, root: HTMLElement) {
  const next = node.nextSibling;
  if (next?.nodeType === Node.TEXT_NODE) return next as Text;

  const textNode = document.createTextNode(CURSOR_GAP);
  if (next) {
    root.insertBefore(textNode, next);
  } else {
    root.appendChild(textNode);
  }
  return textNode;
}

function placeBeforeChip(chip: HTMLElement, root: HTMLElement) {
  const previous = chip.previousSibling;
  if (previous instanceof Text) {
    const atEnd = previous.textContent?.length ?? 0;
    if (atEnd === 0 && chip.classList.contains("mx-1")) {
      previous.textContent = CURSOR_GAP;
      setCollapsedSelection(previous, 1);
      return;
    }
    setCollapsedSelection(previous, atEnd);
    return;
  }

  const textNode = document.createTextNode("");
  root.insertBefore(textNode, chip);
  setCollapsedSelection(textNode, 0);
}

function placeAfterNode(node: ChildNode, root: HTMLElement) {
  const textNode = ensureTextNodeAfter(node, root);
  setCollapsedSelection(textNode, 0);
}

export function syncRichTextDom(root: HTMLElement, block: DocumentBlock) {
  const inlineMap = new Map((block.inlines ?? []).map((inline) => [inline.id, inline]));
  root.replaceChildren();

  const segments = splitTextWithInlineMarkers(block.text);

  if (segments.length === 0) {
    root.appendChild(document.createTextNode(""));
    return;
  }

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index]!;
    if (segment.kind === "text") {
      const prevIsInline = index > 0 && segments[index - 1]?.kind === "inline";
      const nextIsInline =
        index < segments.length - 1 && segments[index + 1]?.kind === "inline";
      const displayText = displayTextForSegment(
        segment.value,
        prevIsInline,
        nextIsInline
      );
      if (displayText.length > 0) {
        root.appendChild(document.createTextNode(displayText));
      }
      continue;
    }

    const inline = inlineMap.get(segment.id);
    if (inline) {
      const lastChild = root.lastChild;
      if (isInlineChipNode(lastChild)) {
        root.appendChild(document.createTextNode(CURSOR_GAP));
      }
      const isFirstOnLine = root.childNodes.length === 0;
      root.appendChild(
        createInlineChipElement(inline, { isFirstOnLine })
      );
    }
  }

  if (!root.childNodes.length) {
    root.appendChild(document.createTextNode(""));
    return;
  }

  const firstChild = root.firstChild;
  if (
    firstChild instanceof HTMLElement &&
    firstChild.dataset.inlineId &&
    !(firstChild.previousSibling instanceof Text)
  ) {
    root.insertBefore(document.createTextNode(""), firstChild);
  }

  const lastChild = root.lastChild;
  if (
    lastChild instanceof HTMLElement &&
    lastChild.dataset.inlineId &&
    !(lastChild.nextSibling instanceof Text)
  ) {
    root.appendChild(document.createTextNode(CURSOR_GAP));
  }
}

export function getSelectionCaretRect() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0).cloneRange();
  range.collapse(true);
  const rect = range.getClientRects()[0] ?? range.getBoundingClientRect();
  if (!rect) return null;

  return { top: rect.top, left: rect.left };
}

export function getSelectionTextOffset(root: HTMLElement) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return 0;

  const { startContainer, startOffset } = selection.getRangeAt(0);

  if (startContainer === root) {
    let offset = 0;
    const limit = Math.min(startOffset, root.childNodes.length);
    for (let index = 0; index < limit; index += 1) {
      offset += getNodeStoredLength(root.childNodes[index]!);
    }
    return offset;
  }

  let offset = 0;
  for (const node of root.childNodes) {
    if (node === startContainer) {
      if (node.nodeType === Node.TEXT_NODE) {
        return offset + startOffset;
      }
      if (node instanceof HTMLElement && node.dataset.inlineId) {
        return offset + (startOffset > 0 ? getNodeStoredLength(node) : 0);
      }
      return offset;
    }

    if (node.contains(startContainer)) {
      if (node.nodeType === Node.TEXT_NODE) {
        return offset + startOffset;
      }
      if (node instanceof HTMLElement && node.dataset.inlineId) {
        return (
          offset + (startOffset > 0 ? getNodeStoredLength(node) : 0)
        );
      }
      return offset;
    }

    offset += getNodeStoredLength(node);
  }

  return offset;
}

export function getPlainTextBeforeCursor(root: HTMLElement) {
  const serialized = serializeRichTextRoot(root);
  const offset = getSelectionTextOffset(root);
  return serialized.text.slice(0, offset);
}

export function placeCursorAtTextOffset(root: HTMLElement, targetOffset: number) {
  let offset = 0;
  const safeTarget = Math.max(0, targetOffset);

  for (const node of root.childNodes) {
    const length = getNodeStoredLength(node);

    if (node.nodeType === Node.TEXT_NODE) {
      if (offset + length >= safeTarget) {
        setCollapsedSelection(node, safeTarget - offset);
        return;
      }
      offset += length;
      continue;
    }

    if (node instanceof HTMLElement && node.dataset.inlineId) {
      const nextOffset = offset + length;
      if (safeTarget <= offset) {
        placeBeforeChip(node, root);
        return;
      }

      if (safeTarget < nextOffset) {
        placeAfterNode(node, root);
        return;
      }

      if (safeTarget === nextOffset) {
        placeAfterNode(node, root);
        return;
      }

      offset = nextOffset;
    }
  }

  const lastChild = root.lastChild;
  if (lastChild?.nodeType === Node.TEXT_NODE) {
    setCollapsedSelection(lastChild, lastChild.textContent?.length ?? 0);
    return;
  }

  if (lastChild instanceof HTMLElement && lastChild.dataset.inlineId) {
    placeAfterNode(lastChild, root);
    return;
  }

  const textNode = document.createTextNode("");
  root.appendChild(textNode);
  setCollapsedSelection(textNode, 0);
}

export function cleanupInlineEdgeSpaces(root: HTMLElement) {
  for (const node of [...root.childNodes]) {
    if (
      node.nodeType === Node.TEXT_NODE &&
      (node.textContent === INLINE_EDGE_SPACE ||
        node.textContent === CURSOR_GAP ||
        node.textContent === "")
    ) {
      node.remove();
    }
  }
  root.normalize();

  const lastChild = root.lastChild;
  if (
    lastChild instanceof HTMLElement &&
    lastChild.dataset.inlineId &&
    !(lastChild.nextSibling instanceof Text)
  ) {
    root.appendChild(document.createTextNode(CURSOR_GAP));
  }

  if (!root.childNodes.length) {
    root.appendChild(document.createTextNode(""));
  }
}

export function removeInlineNode(root: HTMLElement, inlineId: string) {
  const chip = root.querySelector<HTMLElement>(`[data-inline-id="${inlineId}"]`);
  if (!chip) return;

  const selection = window.getSelection();
  const previous = chip.previousSibling;
  const next = chip.nextSibling;
  const cursorAfterChip =
    selection?.isCollapsed &&
    selection.rangeCount > 0 &&
    selection.getRangeAt(0).startContainer === next &&
    next?.nodeType === Node.TEXT_NODE &&
    selection.getRangeAt(0).startOffset === 0;

  chip.remove();
  cleanupInlineEdgeSpaces(root);

  if (cursorAfterChip && next instanceof Text && next.isConnected) {
    setCollapsedSelection(next, 0);
    return;
  }

  if (previous instanceof Text && previous.isConnected) {
    setCollapsedSelection(previous, previous.textContent?.length ?? 0);
    return;
  }

  if (next instanceof Text && next.isConnected) {
    setCollapsedSelection(next, 0);
    return;
  }

  placeCursorAtTextOffset(root, 0);
}

export function handleInlineBackspace(root: HTMLElement) {
  const selection = window.getSelection();
  if (!selection?.isCollapsed || selection.rangeCount === 0) return false;

  const range = selection.getRangeAt(0);
  const { startContainer, startOffset } = range;

  if (startContainer.nodeType === Node.TEXT_NODE && startOffset === 0) {
    const previous = startContainer.previousSibling;
    if (previous instanceof HTMLElement && previous.dataset.inlineId) {
      return previous.dataset.inlineId;
    }
  }

  if (startContainer === root && startOffset > 0) {
    const previous = root.childNodes[startOffset - 1];
    if (previous instanceof HTMLElement && previous.dataset.inlineId) {
      return previous.dataset.inlineId;
    }
  }

  return false;
}

export function isRichTextEmpty(root: HTMLElement) {
  const { text, inlines } = serializeRichTextRoot(root);
  return stripInvisibleEditorText(text).length === 0 && inlines.length === 0;
}

export function stripInvisibleEditorText(text: string) {
  return text
    .replace(/\u200D\{\{inline:[0-9a-f-]+\}\}\u200D/g, "")
    .replace(/\u2009/g, "")
    .replace(/\u200B/g, "")
    .replace(/\n/g, "")
    .trim();
}

export function mergeBlockContentFromDom(
  blocks: DocumentBlock[],
  blockId: string,
  root: HTMLElement | null
) {
  if (!root) return blocks;

  const content = serializeRichTextRoot(root);
  return blocks.map((block) =>
    block.id === blockId
      ? { ...block, text: content.text, inlines: content.inlines }
      : block
  );
}
