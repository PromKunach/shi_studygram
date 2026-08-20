import {
  inlineMarker,
  wrapInlineMarker,
  splitTextWithInlineMarkers,
  type DocumentBlock,
  type DocumentInline,
} from "@/lib/document-blocks";
import { createInlineChipElement } from "@/components/documents/document-google-drive-inline";

export function serializeRichTextRoot(root: HTMLElement): {
  text: string;
  inlines: DocumentInline[];
} {
  let text = "";
  const inlines: DocumentInline[] = [];

  for (const node of root.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent ?? "";
      continue;
    }

    if (!(node instanceof HTMLElement)) continue;

    if (node.tagName === "BR") {
      text += "\n";
      continue;
    }

    const inlineId = node.dataset.inlineId;
    if (inlineId) {
      text += wrapInlineMarker(inlineId);
      inlines.push({
        id: inlineId,
        type: "google-drive",
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

export function syncRichTextDom(root: HTMLElement, block: DocumentBlock) {
  const inlineMap = new Map((block.inlines ?? []).map((inline) => [inline.id, inline]));
  root.replaceChildren();

  const segments = splitTextWithInlineMarkers(block.text);

  if (segments.length === 0) {
    root.appendChild(document.createTextNode(""));
    return;
  }

  for (const segment of segments) {
    if (segment.kind === "text") {
      root.appendChild(document.createTextNode(segment.value));
      continue;
    }

    const inline = inlineMap.get(segment.id);
    if (inline) {
      root.appendChild(createInlineChipElement(inline));
    }
  }

  if (!root.childNodes.length) {
    root.appendChild(document.createTextNode(""));
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
  let offset = 0;
  let found = false;

  for (const node of root.childNodes) {
    if (found) break;

    if (node === startContainer) {
      if (node.nodeType === Node.TEXT_NODE) {
        offset += startOffset;
        found = true;
        break;
      }
    }

    if (node.nodeType === Node.TEXT_NODE) {
      if (node.contains(startContainer)) {
        offset += startOffset;
        found = true;
        break;
      }
      offset += node.textContent?.length ?? 0;
      continue;
    }

    if (node instanceof HTMLElement && node.dataset.inlineId) {
      offset += wrapInlineMarker(node.dataset.inlineId).length;
    }
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

  for (const node of root.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      const length = node.textContent?.length ?? 0;
      if (offset + length >= targetOffset) {
        const range = document.createRange();
        range.setStart(node, targetOffset - offset);
        range.collapse(true);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        return;
      }
      offset += length;
      continue;
    }

    if (node instanceof HTMLElement && node.dataset.inlineId) {
      const markerLength = wrapInlineMarker(node.dataset.inlineId).length;
      if (offset + markerLength >= targetOffset) {
        const next = node.nextSibling;
        if (next?.nodeType === Node.TEXT_NODE) {
          const range = document.createRange();
          range.setStart(next, 0);
          range.collapse(true);
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
          return;
        }

        const textNode = document.createTextNode("");
        node.after(textNode);
        const range = document.createRange();
        range.setStart(textNode, 0);
        range.collapse(true);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        return;
      }
      offset += markerLength;
    }
  }

  root.focus();
}

export function removeInlineNode(root: HTMLElement, inlineId: string) {
  const chip = root.querySelector<HTMLElement>(`[data-inline-id="${inlineId}"]`);
  if (!chip) return;

  const selection = window.getSelection();
  const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
  const cursorNode = range?.startContainer ?? null;
  const cursorOffset = range?.startOffset ?? 0;
  const cursorWasAfterChip =
    cursorNode !== null &&
    cursorNode === chip.nextSibling &&
    cursorNode.nodeType === Node.TEXT_NODE &&
    cursorOffset === 0;

  chip.remove();

  if (cursorWasAfterChip && cursorNode instanceof Text) {
    const newRange = document.createRange();
    newRange.setStart(cursorNode, 0);
    newRange.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(newRange);
  }
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
  return stripMarkers(text).length === 0 && inlines.length === 0;
}

function stripMarkers(text: string) {
  return text.replace(/\u200D\{\{inline:[0-9a-f-]+\}\}\u200D/g, "");
}
