import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Bookmark,
  Calculator,
  ClipboardList,
  FileText,
  Folder,
  Globe,
  GraduationCap,
  Image,
  Layers,
  Lightbulb,
  Microscope,
  Music,
  NotebookPen,
  PenLine,
} from "lucide-react";

export type DocumentContentType = "folder" | "document";

export type DocumentIconId =
  | "file-text"
  | "folder"
  | "book-open"
  | "notebook-pen"
  | "pen-line"
  | "calculator"
  | "graduation-cap"
  | "lightbulb"
  | "bookmark"
  | "clipboard-list"
  | "layers"
  | "image"
  | "music"
  | "globe"
  | "microscope";

export type DocumentIconOption = {
  id: DocumentIconId;
  label: string;
  icon: LucideIcon;
};

export const DOCUMENT_ICON_OPTIONS: DocumentIconOption[] = [
  { id: "folder", label: "โฟลเดอร์", icon: Folder },
  { id: "file-text", label: "เอกสาร", icon: FileText },
  { id: "book-open", label: "หนังสือ", icon: BookOpen },
  { id: "notebook-pen", label: "สมุดโน้ต", icon: NotebookPen },
  { id: "pen-line", label: "ปากกา", icon: PenLine },
  { id: "calculator", label: "คำนวณ", icon: Calculator },
  { id: "graduation-cap", label: "การศึกษา", icon: GraduationCap },
  { id: "lightbulb", label: "ไอเดีย", icon: Lightbulb },
  { id: "bookmark", label: "บุ๊กมาร์ก", icon: Bookmark },
  { id: "clipboard-list", label: "รายการ", icon: ClipboardList },
  { id: "layers", label: "เลเยอร์", icon: Layers },
  { id: "image", label: "รูปภาพ", icon: Image },
  { id: "music", label: "เพลง", icon: Music },
  { id: "globe", label: "โลก", icon: Globe },
  { id: "microscope", label: "วิทยาศาสตร์", icon: Microscope },
];

const ICON_MAP = Object.fromEntries(
  DOCUMENT_ICON_OPTIONS.map((option) => [option.id, option.icon])
) as Record<DocumentIconId, LucideIcon>;

export function getDocumentIcon(id: DocumentIconId): LucideIcon {
  return ICON_MAP[id] ?? FileText;
}

export function defaultIconForType(type: DocumentContentType): DocumentIconId {
  return type === "folder" ? "folder" : "file-text";
}

export function sortDocumentsWithFoldersFirst<
  T extends { type: DocumentContentType },
>(items: T[]) {
  const folders: T[] = [];
  const documents: T[] = [];

  for (const item of items) {
    if (item.type === "folder") folders.push(item);
    else documents.push(item);
  }

  return [...folders, ...documents];
}
