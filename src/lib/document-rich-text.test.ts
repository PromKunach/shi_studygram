import { describe, expect, it } from "vitest";
import { createLinkInline, wrapInlineMarker } from "./document-blocks";
import {
  getSelectionTextOffset,
  placeCursorAtTextOffset,
  serializeRichTextRoot,
} from "./document-rich-text";

function setSelection(node: Node, offset: number) {
  const range = document.createRange();
  range.setStart(node, offset);
  range.collapse(true);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

describe("selection offsets", () => {
  it("reads the cursor offset inside a text node", () => {
    const root = document.createElement("div");
    const text = document.createTextNode("hello");
    root.appendChild(text);
    document.body.appendChild(root);

    setSelection(text, 3);
    expect(getSelectionTextOffset(root)).toBe(3);

    root.remove();
  });

  it("reads the cursor offset when the root owns the selection", () => {
    const root = document.createElement("div");
    const text = document.createTextNode("hello");
    root.appendChild(text);
    document.body.appendChild(root);

    setSelection(root, 1);
    expect(getSelectionTextOffset(root)).toBe(5);

    root.remove();
  });

  it("counts inline chips using stored marker length", () => {
    const inline = createLinkInline("https://example.com", "Example");
    const root = document.createElement("div");
    const before = document.createTextNode("hi");
    const chip = document.createElement("span");
    chip.dataset.inlineId = inline.id;
    chip.dataset.inlineType = "link";
    chip.textContent = "Example";
    root.append(before, chip);
    document.body.appendChild(root);

    setSelection(root, 2);
    expect(getSelectionTextOffset(root)).toBe(
      2 + wrapInlineMarker(inline.id).length
    );

    root.remove();
  });

  it("places the cursor at the end of text content", () => {
    const root = document.createElement("div");
    const text = document.createTextNode("hello");
    root.appendChild(text);
    document.body.appendChild(root);

    placeCursorAtTextOffset(root, 5);
    const selection = window.getSelection();
    expect(selection?.anchorNode).toBe(text);
    expect(selection?.anchorOffset).toBe(5);

    root.remove();
  });

  it("round-trips cursor offsets through serialize", () => {
    const root = document.createElement("div");
    root.appendChild(document.createTextNode("bullet text"));
    document.body.appendChild(root);

    setSelection(root.firstChild!, 6);
    const offset = getSelectionTextOffset(root);
    placeCursorAtTextOffset(root, offset);

    const serialized = serializeRichTextRoot(root);
    expect(serialized.text).toBe("bullet text");
    expect(window.getSelection()?.anchorOffset).toBe(6);

    root.remove();
  });
});
