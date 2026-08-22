import { describe, expect, it } from "vitest";
import { createDocumentBlock } from "./document-blocks";
import {
  canRedoDocumentEditor,
  canUndoDocumentEditor,
  clearDocumentEditorHistory,
  createDocumentEditorHistory,
  isDocumentRedoHotkey,
  isDocumentUndoHotkey,
  pushDocumentUndo,
  redoDocumentEditor,
  undoDocumentEditor,
} from "./document-history";

function snapshot(
  texts: string[],
  focus?: { blockId: string; offset: number } | null
) {
  const blocks = texts.map((text) => createDocumentBlock("paragraph", text));
  return {
    blocks,
    focus:
      focus === undefined
        ? { blockId: blocks[0]!.id, offset: texts[0]?.length ?? 0 }
        : focus,
  };
}

function hotkey(partial: {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
}) {
  return {
    key: partial.key,
    ctrlKey: partial.ctrlKey ?? false,
    metaKey: partial.metaKey ?? false,
    shiftKey: partial.shiftKey ?? false,
    altKey: partial.altKey ?? false,
  };
}

describe("document editor history", () => {
  it("undoes creating a new block", () => {
    const history = createDocumentEditorHistory();
    const beforeCreate = snapshot(["hello"]);
    const afterCreate = snapshot(["hello", ""]);

    pushDocumentUndo(history, beforeCreate);

    expect(canUndoDocumentEditor(history)).toBe(true);

    const restored = undoDocumentEditor(history, afterCreate);

    expect(restored?.blocks.map((block) => block.text)).toEqual(["hello"]);
    expect(restored?.blocks).toHaveLength(1);
    expect(canRedoDocumentEditor(history)).toBe(true);
  });

  it("redoes creating a new block after undo", () => {
    const history = createDocumentEditorHistory();
    const beforeCreate = snapshot(["hello"]);
    const afterCreate = snapshot(["hello", ""]);

    pushDocumentUndo(history, beforeCreate);
    undoDocumentEditor(history, afterCreate);

    const redone = redoDocumentEditor(history, beforeCreate);

    expect(redone?.blocks.map((block) => block.text)).toEqual(["hello", ""]);
    expect(canUndoDocumentEditor(history)).toBe(true);
    expect(canRedoDocumentEditor(history)).toBe(false);
  });

  it("returns null when there is nothing to undo or redo", () => {
    const history = createDocumentEditorHistory();
    const current = snapshot(["hello"]);

    expect(undoDocumentEditor(history, current)).toBeNull();
    expect(redoDocumentEditor(history, current)).toBeNull();
  });

  it("clears redo when a new action is recorded after undo", () => {
    const history = createDocumentEditorHistory();
    const beforeCreate = snapshot(["hello"]);
    const afterCreate = snapshot(["hello", ""]);
    const afterTyping = snapshot(["hello", "world"]);

    pushDocumentUndo(history, beforeCreate);
    undoDocumentEditor(history, afterCreate);
    pushDocumentUndo(history, beforeCreate);

    expect(canRedoDocumentEditor(history)).toBe(false);

    const restored = undoDocumentEditor(history, afterTyping);
    expect(restored?.blocks.map((block) => block.text)).toEqual(["hello"]);
  });

  it("clones snapshots so later mutations do not change history", () => {
    const history = createDocumentEditorHistory();
    const beforeCreate = snapshot(["hello"]);

    pushDocumentUndo(history, beforeCreate);
    beforeCreate.blocks[0]!.text = "mutated";

    const restored = undoDocumentEditor(
      history,
      snapshot(["hello", ""])
    );

    expect(restored?.blocks[0]?.text).toBe("hello");
  });

  it("drops the oldest snapshot when the stack exceeds the limit", () => {
    const history = createDocumentEditorHistory();

    pushDocumentUndo(history, snapshot(["one"]), 2);
    pushDocumentUndo(history, snapshot(["two"]), 2);
    pushDocumentUndo(history, snapshot(["three"]), 2);

    const first = undoDocumentEditor(history, snapshot(["four"]));
    const second = undoDocumentEditor(history, first!);
    const third = undoDocumentEditor(history, second!);

    expect(first?.blocks[0]?.text).toBe("three");
    expect(second?.blocks[0]?.text).toBe("two");
    expect(third).toBeNull();
  });

  it("clears all history", () => {
    const history = createDocumentEditorHistory();
    pushDocumentUndo(history, snapshot(["hello"]));
    undoDocumentEditor(history, snapshot(["hello", ""]));

    clearDocumentEditorHistory(history);

    expect(canUndoDocumentEditor(history)).toBe(false);
    expect(canRedoDocumentEditor(history)).toBe(false);
  });
});

describe("document editor history hotkeys", () => {
  it("treats Ctrl+Z and Cmd+Z as undo", () => {
    expect(isDocumentUndoHotkey(hotkey({ key: "z", ctrlKey: true }))).toBe(
      true
    );
    expect(isDocumentUndoHotkey(hotkey({ key: "z", metaKey: true }))).toBe(
      true
    );
    expect(
      isDocumentUndoHotkey(hotkey({ key: "z", ctrlKey: true, shiftKey: true }))
    ).toBe(false);
  });

  it("treats Ctrl+Shift+Z, Cmd+Shift+Z, and Ctrl+Y as redo", () => {
    expect(
      isDocumentRedoHotkey(hotkey({ key: "z", ctrlKey: true, shiftKey: true }))
    ).toBe(true);
    expect(
      isDocumentRedoHotkey(hotkey({ key: "z", metaKey: true, shiftKey: true }))
    ).toBe(true);
    expect(isDocumentRedoHotkey(hotkey({ key: "y", ctrlKey: true }))).toBe(
      true
    );
    expect(isDocumentRedoHotkey(hotkey({ key: "y", metaKey: true }))).toBe(
      false
    );
  });
});
