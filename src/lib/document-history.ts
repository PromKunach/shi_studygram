import type { DocumentBlock } from "@/lib/document-blocks";

export const MAX_DOCUMENT_HISTORY = 100;

export type DocumentEditorFocus = {
  blockId: string;
  offset: number;
};

export type DocumentEditorSnapshot = {
  blocks: DocumentBlock[];
  focus: DocumentEditorFocus | null;
};

export type DocumentEditorHistory = {
  undoStack: DocumentEditorSnapshot[];
  redoStack: DocumentEditorSnapshot[];
};

export type DocumentEditorHotkey = {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
};

export function cloneDocumentBlocks(blocks: DocumentBlock[]): DocumentBlock[] {
  return blocks.map((block) => ({
    ...block,
    inlines: block.inlines?.map((inline) => ({ ...inline })),
  }));
}

function cloneSnapshot(
  snapshot: DocumentEditorSnapshot
): DocumentEditorSnapshot {
  return {
    blocks: cloneDocumentBlocks(snapshot.blocks),
    focus: snapshot.focus ? { ...snapshot.focus } : null,
  };
}

export function createDocumentEditorHistory(): DocumentEditorHistory {
  return {
    undoStack: [],
    redoStack: [],
  };
}

export function clearDocumentEditorHistory(history: DocumentEditorHistory) {
  history.undoStack = [];
  history.redoStack = [];
}

export function canUndoDocumentEditor(history: DocumentEditorHistory) {
  return history.undoStack.length > 0;
}

export function canRedoDocumentEditor(history: DocumentEditorHistory) {
  return history.redoStack.length > 0;
}

export function pushDocumentUndo(
  history: DocumentEditorHistory,
  snapshot: DocumentEditorSnapshot,
  max = MAX_DOCUMENT_HISTORY
) {
  history.undoStack.push(cloneSnapshot(snapshot));
  history.redoStack = [];

  if (history.undoStack.length > max) {
    history.undoStack.shift();
  }
}

export function undoDocumentEditor(
  history: DocumentEditorHistory,
  current: DocumentEditorSnapshot
): DocumentEditorSnapshot | null {
  const previous = history.undoStack.pop();
  if (!previous) return null;

  history.redoStack.push(cloneSnapshot(current));
  return previous;
}

export function redoDocumentEditor(
  history: DocumentEditorHistory,
  current: DocumentEditorSnapshot
): DocumentEditorSnapshot | null {
  const next = history.redoStack.pop();
  if (!next) return null;

  history.undoStack.push(cloneSnapshot(current));
  return next;
}

export function isDocumentUndoHotkey(event: DocumentEditorHotkey) {
  if (event.altKey) return false;
  if (!(event.ctrlKey || event.metaKey) || event.shiftKey) return false;
  return event.key === "z" || event.key === "Z";
}

export function isDocumentRedoHotkey(event: DocumentEditorHotkey) {
  if (event.altKey) return false;
  if (!(event.ctrlKey || event.metaKey)) return false;

  if (event.key === "y" || event.key === "Y") {
    return event.ctrlKey && !event.metaKey;
  }

  return (event.key === "z" || event.key === "Z") && event.shiftKey;
}
