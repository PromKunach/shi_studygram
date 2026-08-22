export type DocumentBlockType = "paragraph" | "h1" | "h2" | "h3" | "bullet";

export type DocumentInlineType = "google-drive" | "link";

export type DocumentInline = {
  id: string;
  type: DocumentInlineType;
  url: string;
  name: string;
};

export type DocumentBlock = {
  id: string;
  type: DocumentBlockType;
  text: string;
  inlines?: DocumentInline[];
};

export type DocumentBlocksPayload = {
  version: 1;
  blocks: DocumentBlock[];
};

export type SlashCommandId = DocumentBlockType | "google-drive" | "link";

const INLINE_MARKER_PATTERN = /\u200D\{\{inline:([0-9a-f-]+)\}\}\u200D/g;

export function inlineMarker(id: string) {
  return `\u200D{{inline:${id}}}\u200D`;
}

/** Thin spaces around inline markers so the caret is not flush against chips. */
export const INLINE_EDGE_SPACE = "\u2009";

export function wrapInlineMarker(id: string) {
  return `${INLINE_EDGE_SPACE}${inlineMarker(id)}${INLINE_EDGE_SPACE}`;
}

export function wrapInlineMarkerLength(id: string) {
  return wrapInlineMarker(id).length;
}

export function createDocumentBlock(
  type: DocumentBlockType = "paragraph",
  text = "",
  inlines: DocumentInline[] = []
): DocumentBlock {
  return {
    id: crypto.randomUUID(),
    type,
    text,
    inlines,
  };
}

export function createGoogleDriveInline(
  url: string,
  name: string
): DocumentInline {
  return {
    id: crypto.randomUUID(),
    type: "google-drive",
    url,
    name,
  };
}

export function createLinkInline(url: string, name: string): DocumentInline {
  return {
    id: crypto.randomUUID(),
    type: "link",
    url,
    name,
  };
}

export function createDocumentInline(
  type: DocumentInlineType,
  url: string,
  name: string
): DocumentInline {
  return type === "link"
    ? createLinkInline(url, name)
    : createGoogleDriveInline(url, name);
}

export type TextSegment =
  | { kind: "text"; value: string }
  | { kind: "inline"; id: string };

export function splitTextWithInlineMarkers(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(INLINE_MARKER_PATTERN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      segments.push({
        kind: "text",
        value: text.slice(lastIndex, index),
      });
    }
    segments.push({ kind: "inline", id: match[1]! });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ kind: "text", value: text.slice(lastIndex) });
  }

  return segments;
}

export function stripInlineMarkers(text: string) {
  return text.replace(INLINE_MARKER_PATTERN, "");
}

export function normalizeDocumentInline(raw: unknown): DocumentInline | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Partial<DocumentInline>;
  if (record.type !== "google-drive" && record.type !== "link") return null;
  if (typeof record.id !== "string") return null;
  if (typeof record.url !== "string") return null;
  if (typeof record.name !== "string") return null;
  return {
    id: record.id,
    type: record.type,
    url: record.url,
    name: record.name,
  };
}

function normalizeBlock(raw: unknown): DocumentBlock | null {
  if (!raw || typeof raw !== "object") return null;

  const record = raw as {
    id?: string;
    type?: string;
    text?: string;
    inlines?: unknown;
    driveUrl?: string;
    driveName?: string;
    driveCommitted?: boolean;
  };

  if (record.type === "google-drive") {
    if (
      record.driveCommitted &&
      typeof record.driveUrl === "string" &&
      typeof record.driveName === "string" &&
      record.driveUrl.trim() &&
      record.driveName.trim()
    ) {
      const inline = createGoogleDriveInline(
        record.driveUrl.trim(),
        record.driveName.trim()
      );
      return {
        id: crypto.randomUUID(),
        type: "paragraph",
        text: inlineMarker(inline.id),
        inlines: [inline],
      };
    }
    return null;
  }

  const type = record.type;
  if (
    type !== "paragraph" &&
    type !== "h1" &&
    type !== "h2" &&
    type !== "h3" &&
    type !== "bullet"
  ) {
    return null;
  }

  const inlines = Array.isArray(record.inlines)
    ? record.inlines
        .map(normalizeDocumentInline)
        .filter((inline): inline is DocumentInline => inline !== null)
    : undefined;

  return {
    id: typeof record.id === "string" ? record.id : crypto.randomUUID(),
    type,
    text: typeof record.text === "string" ? record.text : "",
    inlines,
  };
}

export function parseDocumentContent(raw: string): DocumentBlock[] {
  if (!raw.trim()) return [createDocumentBlock()];

  try {
    const parsed = JSON.parse(raw) as DocumentBlocksPayload;
    if (parsed?.version === 1 && Array.isArray(parsed.blocks)) {
      const blocks = parsed.blocks
        .map(normalizeBlock)
        .filter((block): block is DocumentBlock => block !== null);

      return blocks.length > 0 ? blocks : [createDocumentBlock()];
    }
  } catch {
    /* legacy plain text */
  }

  return [createDocumentBlock("paragraph", raw)];
}

export function serializeDocumentContent(blocks: DocumentBlock[]): string {
  const payload: DocumentBlocksPayload = {
    version: 1,
    blocks,
  };
  return JSON.stringify(payload);
}

export function insertInlineAtOffset(
  block: DocumentBlock,
  offset: number,
  inline: DocumentInline
) {
  const safeOffset = Math.max(0, Math.min(offset, block.text.length));
  return {
    text:
      block.text.slice(0, safeOffset) +
      wrapInlineMarker(inline.id) +
      block.text.slice(safeOffset),
    inlines: [...(block.inlines ?? []), inline],
  };
}

export function removeInlineFromBlock(block: DocumentBlock, inlineId: string) {
  return {
    text: block.text
      .replace(wrapInlineMarker(inlineId), "")
      .replace(inlineMarker(inlineId), ""),
    inlines: (block.inlines ?? []).filter((inline) => inline.id !== inlineId),
  };
}

export function splitBlockAtOffset(block: DocumentBlock, offset: number) {
  const safeOffset = Math.max(0, Math.min(offset, block.text.length));
  const inlines = block.inlines ?? [];
  const inlineMap = new Map(inlines.map((inline) => [inline.id, inline]));

  const beforeParts: string[] = [];
  const afterParts: string[] = [];
  const beforeInlines: DocumentInline[] = [];
  const afterInlines: DocumentInline[] = [];

  let pos = 0;
  for (const segment of splitTextWithInlineMarkers(block.text)) {
    if (segment.kind === "text") {
      const value = segment.value;
      const start = pos;
      const end = pos + value.length;

      if (end <= safeOffset) {
        beforeParts.push(value);
      } else if (start >= safeOffset) {
        afterParts.push(value);
      } else {
        const splitAt = safeOffset - start;
        beforeParts.push(value.slice(0, splitAt));
        afterParts.push(value.slice(splitAt));
      }

      pos = end;
      continue;
    }

    const inline = inlineMap.get(segment.id);
    const marker = inline
      ? wrapInlineMarker(inline.id)
      : inlineMarker(segment.id);
    const markerLen = marker.length;
    const start = pos;
    const end = pos + markerLen;

    if (end <= safeOffset) {
      beforeParts.push(marker);
      if (inline) beforeInlines.push(inline);
    } else if (start >= safeOffset) {
      afterParts.push(marker);
      if (inline) afterInlines.push(inline);
    } else {
      beforeParts.push(marker);
      if (inline) beforeInlines.push(inline);
    }

    pos = end;
  }

  return {
    before: {
      text: normalizeStoredInlineText(beforeParts.join(""), beforeInlines),
      inlines: beforeInlines,
    },
    after: {
      text: normalizeStoredInlineText(afterParts.join(""), afterInlines),
      inlines: afterInlines,
    },
  };
}

function normalizeStoredInlineText(text: string, inlines: DocumentInline[]) {
  const inlineMap = new Map(inlines.map((inline) => [inline.id, inline]));
  let normalized = "";

  for (const segment of splitTextWithInlineMarkers(text)) {
    if (segment.kind === "text") {
      const trimmed = segment.value.replace(/^\u2009+|\u2009+$/g, "");
      if (trimmed) normalized += trimmed;
      continue;
    }

    const inline = inlineMap.get(segment.id);
    if (inline) normalized += wrapInlineMarker(inline.id);
  }

  return normalized;
}

export function updateInlineInBlock(
  block: DocumentBlock,
  inlineId: string,
  patch: Pick<DocumentInline, "url" | "name">
) {
  return {
    inlines: (block.inlines ?? []).map((inline) =>
      inline.id === inlineId ? { ...inline, ...patch } : inline
    ),
  };
}

export type SlashCommand = {
  id: SlashCommandId;
  label: string;
  description: string;
  keywords: string[];
};

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    id: "h1",
    label: "Heading 1",
    description: "หัวข้อใหญ่",
    keywords: ["h1", "heading 1", "heading1", "หัวข้อ 1"],
  },
  {
    id: "h2",
    label: "Heading 2",
    description: "หัวข้อกลาง",
    keywords: ["h2", "heading 2", "heading2", "หัวข้อ 2"],
  },
  {
    id: "h3",
    label: "Heading 3",
    description: "หัวข้อเล็ก",
    keywords: ["h3", "heading 3", "heading3", "หัวข้อ 3"],
  },
  {
    id: "google-drive",
    label: "Google Drive",
    description: "แนบลิงก์ Google Drive",
    keywords: [
      "google",
      "drive",
      "google drive",
      "gdrive",
      "ลิงก์",
      "embed",
    ],
  },
  {
    id: "link",
    label: "Link",
    description: "แนบลิงก์",
    keywords: ["link", "url", "href", "ลิงก์", "website"],
  },
  {
    id: "bullet",
    label: "Bullets",
    description: "รายการจุด",
    keywords: ["bullet", "bullets", "list", "ul", "รายการ", "จุด"],
  },
];

export function filterSlashCommands(query: string): SlashCommand[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return SLASH_COMMANDS;

  return SLASH_COMMANDS.filter((command) => {
    const haystack = [
      command.label,
      command.description,
      ...command.keywords,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalized);
  });
}

export function detectSlashTrigger(text: string, cursorPos: number) {
  const before = text.slice(0, cursorPos);
  const match = before.match(/\/([^\s/]*)$/);
  if (!match || match.index === undefined) return null;

  return {
    query: match[1] ?? "",
    slashIndex: match.index,
  };
}

export function blockTypeClassName(type: DocumentBlockType) {
  switch (type) {
    case "h1":
      return "text-3xl font-bold leading-tight tracking-tight sm:text-[2rem]";
    case "h2":
      return "text-2xl font-semibold leading-snug";
    case "h3":
      return "text-xl font-semibold leading-snug";
    case "bullet":
      return "text-base leading-relaxed";
    default:
      return "text-base leading-relaxed";
  }
}

export function toGoogleDrivePreviewUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return "";

  const fileMatch = trimmed.match(/\/file\/d\/([^/]+)/);
  if (fileMatch?.[1]) {
    return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;
  }

  const openMatch = trimmed.match(/[?&]id=([^&]+)/);
  if (openMatch?.[1]) {
    return `https://drive.google.com/file/d/${openMatch[1]}/preview`;
  }

  return trimmed;
}

export function isHeadingBlock(type: DocumentBlockType) {
  return type === "h1" || type === "h2" || type === "h3";
}

export function isBulletBlock(type: DocumentBlockType) {
  return type === "bullet";
}

export function isInlineSlashCommand(
  id: SlashCommandId
): id is "google-drive" | "link" {
  return id === "google-drive" || id === "link";
}
