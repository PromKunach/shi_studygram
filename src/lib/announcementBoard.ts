/**
 * Board content for an announcement: free-form text blocks placed on a fixed
 * canvas. Positions are stored relative (0–1) to the canvas so they survive
 * canvas size changes.
 *
 * Persisted in Supabase `announcement_boards` (one row per announcement).
 */

import { supabase } from "@/lib/supabaseClient"

export const BOARD_WIDTH = 2400
export const BOARD_HEIGHT = 1600

export type BoardAuthor = {
  studentId: string
  displayName: string
  avatarUrl?: string
}

export type BoardBlockLink = {
  id: string
  name: string
  url: string
  /** Offset from the default link node position (board width fraction). */
  offsetX: number
  /** Offset from the default link node position (board height fraction). */
  offsetY: number
}

export type BoardBlockKind =
  | "text"
  | "counter"
  | "comment"
  | "link"
  | "dock"
  | "appointment"
  | "document"

export type BoardCounterIncrement = {
  id: string
  user: BoardAuthor
  at: string
}

export type BoardCommentEntry = {
  id: string
  text: string
  /** JPEG/PNG/WebP as a data URL, capped when added in the UI. */
  imageDataUrl?: string
  user?: BoardAuthor
  at: string
}

type BoardBlockShared = {
  id: string
  /** 0–1, fraction of board width */
  x: number
  /** 0–1, fraction of board height */
  y: number
  /** 0–1, fraction of board width */
  width: number
  author: BoardAuthor
  createdAt: string
  /** When set, this block follows the parent block while dragging. */
  glueParentId?: string | null
  /** Relative X offset from glue parent (board width fraction). */
  glueOffsetX?: number
  /** Relative Y offset from glue parent (board height fraction). */
  glueOffsetY?: number
}

export type BoardTextBlock = BoardBlockShared & {
  kind?: "text"
  text: string
  description: string
  color: string
  fontSize: number
}

export type BoardLinkBlock = BoardBlockShared & {
  kind: "link"
  name: string
  url: string
}

export type BoardCounterBlock = BoardBlockShared & {
  kind: "counter"
  name: string
  value: number
  increments: BoardCounterIncrement[]
}

export type BoardCommentBlock = BoardBlockShared & {
  kind: "comment"
  title: string
  comments: BoardCommentEntry[]
  color: string
  fontSize: number
}

export type DockSnapSide = "above" | "below"

export type BoardDockBlock = BoardBlockShared & {
  kind: "dock"
  dockedBlockIds: string[]
  /** Block id when snapped to a normal node */
  snapToId: string | null
  /** Whether the dock sits above or below snapToId */
  snapSide: DockSnapSide | null
}

export type BoardAppointmentBlock = BoardBlockShared & {
  kind: "appointment"
}

export type BoardDocumentBlock = BoardBlockShared & {
  kind: "document"
  documentId: string | null
}

export type BoardBlock =
  | BoardTextBlock
  | BoardCounterBlock
  | BoardCommentBlock
  | BoardLinkBlock
  | BoardDockBlock
  | BoardAppointmentBlock
  | BoardDocumentBlock

export type BoardConnection = {
  id: string
  fromId: string
  toId: string
  createdAt: string
  appointmentId?: string | null
  tone?: "red" | "blue" | "neutral"
  customTagLabel?: string | null
  customTagColor?: string | null
}

export type BoardContent = {
  blocks: BoardBlock[]
  connections: BoardConnection[]
  updatedAt: string | null
}

export type AnnouncementBoardRecord = {
  announcement_id: string
  blocks: BoardBlock[]
  connections: BoardConnection[]
  updated_at: string
}

export type SaveBoardInput = {
  announcementId: string
  blocks: BoardBlock[]
  connections: BoardConnection[]
}

export const EMPTY_BOARD: BoardContent = {
  blocks: [],
  connections: [],
  updatedAt: null,
}

export const DEFAULT_BLOCK_COLOR = "#1f2937"

export type MessageBlockThemeTokens = {
  background: string
  border: string
  divider: string
  foreground: string
  muted: string
}

export type MessageBlockColorPreset = {
  id: string
  label: string
  value: string
  swatch: string
  light: MessageBlockThemeTokens
  dark: MessageBlockThemeTokens
}

export const MESSAGE_BLOCK_COLOR_PRESETS: MessageBlockColorPreset[] = [
  {
    id: "default",
    label: "ค่าเริ่มต้น",
    value: DEFAULT_BLOCK_COLOR,
    swatch: "var(--card)",
    light: {
      background: "var(--card)",
      border: "transparent",
      divider: "color-mix(in srgb, var(--border) 80%, transparent)",
      foreground: "var(--card-foreground)",
      muted: "var(--muted-foreground)",
    },
    dark: {
      background: "var(--card)",
      border: "transparent",
      divider: "color-mix(in srgb, var(--border) 80%, transparent)",
      foreground: "var(--card-foreground)",
      muted: "var(--muted-foreground)",
    },
  },
  {
    id: "rose",
    label: "ชมพู",
    value: "rose",
    swatch: "#f48fb1",
    light: {
      background: "#fde8ef",
      border: "#f48fb1",
      divider: "#f8b4c8",
      foreground: "#880e4f",
      muted: "#c2185b",
    },
    dark: {
      background: "#3b1c24",
      border: "#e91e63",
      divider: "#5c2838",
      foreground: "#ffc1d9",
      muted: "#f48fb1",
    },
  },
  {
    id: "sand",
    label: "ทราย",
    value: "sand",
    swatch: "#ffcc80",
    light: {
      background: "#fff8e7",
      border: "#ffb74d",
      divider: "#ffe0b2",
      foreground: "#6d4c1a",
      muted: "#a67c2e",
    },
    dark: {
      background: "#2e2618",
      border: "#ffa726",
      divider: "#4a3a20",
      foreground: "#ffe8b3",
      muted: "#ffcc80",
    },
  },
  {
    id: "sage",
    label: "เขียว",
    value: "sage",
    swatch: "#81c784",
    light: {
      background: "#e8f5e9",
      border: "#66bb6a",
      divider: "#a5d6a7",
      foreground: "#1b5e20",
      muted: "#388e3c",
    },
    dark: {
      background: "#1a2e1c",
      border: "#43a047",
      divider: "#2a4030",
      foreground: "#c8e6c9",
      muted: "#81c784",
    },
  },
  {
    id: "mist",
    label: "ฟ้า",
    value: "mist",
    swatch: "#64b5f6",
    light: {
      background: "#e3f2fd",
      border: "#42a5f5",
      divider: "#90caf9",
      foreground: "#0d47a1",
      muted: "#1976d2",
    },
    dark: {
      background: "#1a2533",
      border: "#2196f3",
      divider: "#2a3a50",
      foreground: "#bbdefb",
      muted: "#64b5f6",
    },
  },
  {
    id: "lavender",
    label: "ม่วง",
    value: "lavender",
    swatch: "#ba68c8",
    light: {
      background: "#f3e5f5",
      border: "#ab47bc",
      divider: "#ce93d8",
      foreground: "#4a148c",
      muted: "#7b1fa2",
    },
    dark: {
      background: "#2a1a33",
      border: "#9c27b0",
      divider: "#3d2850",
      foreground: "#e1bee7",
      muted: "#ba68c8",
    },
  },
  {
    id: "coral",
    label: "ส้ม",
    value: "coral",
    swatch: "#ff8a65",
    light: {
      background: "#fff0eb",
      border: "#ff7043",
      divider: "#ffab91",
      foreground: "#bf360c",
      muted: "#e64a19",
    },
    dark: {
      background: "#331f18",
      border: "#ff5722",
      divider: "#4a2a20",
      foreground: "#ffccbc",
      muted: "#ff8a65",
    },
  },
  {
    id: "sky",
    label: "ฟ้าสด",
    value: "sky",
    swatch: "#4fc3f7",
    light: {
      background: "#e1f5fe",
      border: "#29b6f6",
      divider: "#81d4fa",
      foreground: "#01579b",
      muted: "#0288d1",
    },
    dark: {
      background: "#152a33",
      border: "#03a9f4",
      divider: "#1e3a48",
      foreground: "#b3e5fc",
      muted: "#4fc3f7",
    },
  },
]

const LEGACY_MESSAGE_BLOCK_COLORS: Record<string, string> = {
  "#dc2626": "coral",
  "#db2777": "rose",
  "#ea580c": "coral",
  "#d97706": "sand",
  "#16a34a": "sage",
  "#0d9488": "sage",
  "#2563eb": "mist",
  "#7c3aed": "lavender",
}

export function isDefaultBlockColor(color: string | undefined | null) {
  if (!color) return true
  return resolveMessageBlockColor(color) === DEFAULT_BLOCK_COLOR
}

export function resolveMessageBlockColor(color: string | undefined | null) {
  if (!color) return DEFAULT_BLOCK_COLOR

  const normalized = color.trim().toLowerCase()
  if (normalized === DEFAULT_BLOCK_COLOR) return DEFAULT_BLOCK_COLOR

  const legacy = LEGACY_MESSAGE_BLOCK_COLORS[normalized]
  if (legacy) return legacy

  const preset = MESSAGE_BLOCK_COLOR_PRESETS.find(
    (item) =>
      item.id === color ||
      item.value.toLowerCase() === normalized ||
      item.id === normalized
  )
  if (preset) return preset.value

  return DEFAULT_BLOCK_COLOR
}

export function getMessageBlockTheme(
  color: string | undefined | null,
  mode: "light" | "dark"
): MessageBlockThemeTokens | null {
  const resolved = resolveMessageBlockColor(color)
  if (resolved === DEFAULT_BLOCK_COLOR) return null

  const preset = MESSAGE_BLOCK_COLOR_PRESETS.find(
    (item) => item.value === resolved || item.id === resolved
  )
  if (!preset || preset.id === "default") return null

  return mode === "dark" ? preset.dark : preset.light
}

export function collectGlueDescendantIds(
  parentId: string,
  blocks: BoardBlock[]
): string[] {
  const descendants: string[] = []
  const queue = [parentId]
  const seen = new Set([parentId])

  while (queue.length > 0) {
    const current = queue.shift()!
    for (const block of blocks) {
      if (block.glueParentId !== current || seen.has(block.id)) continue
      descendants.push(block.id)
      seen.add(block.id)
      queue.push(block.id)
    }
  }

  return descendants
}

export function findGlueGroupRootId(blockId: string, blocks: BoardBlock[]) {
  let rootId = blockId
  const seen = new Set<string>()

  while (true) {
    const block = blocks.find((item) => item.id === rootId)
    const parentId = block?.glueParentId
    if (!parentId || seen.has(parentId)) break
    seen.add(rootId)
    rootId = parentId
  }

  return rootId
}

/** Root + every block glued beneath it in the same group. */
export function collectGlueGroupMemberIds(
  blockId: string,
  blocks: BoardBlock[]
) {
  const rootId = findGlueGroupRootId(blockId, blocks)
  return [rootId, ...collectGlueDescendantIds(rootId, blocks)]
}

export function wouldCreateGlueCycle(
  parentId: string,
  childId: string,
  blocks: BoardBlock[]
) {
  if (parentId === childId) return true

  let current: string | null | undefined = parentId
  const seen = new Set<string>()
  while (current) {
    if (current === childId) return true
    if (seen.has(current)) return false
    seen.add(current)
    const block = blocks.find((item) => item.id === current)
    current = block?.glueParentId ?? null
  }

  return false
}

export function createGluePatch(
  parent: BoardBlock,
  child: BoardBlock
): Pick<BoardBlock, "glueParentId" | "glueOffsetX" | "glueOffsetY"> {
  return {
    glueParentId: parent.id,
    glueOffsetX: child.x - parent.x,
    glueOffsetY: child.y - parent.y,
  }
}

function normalizeGlueFields<T extends BoardBlock>(block: T): T {
  const raw = block as T & {
    glueParentId?: unknown
    glueOffsetX?: unknown
    glueOffsetY?: unknown
  }
  const glueParentId =
    typeof raw.glueParentId === "string" ? raw.glueParentId : null
  const glueOffsetX =
    typeof raw.glueOffsetX === "number" ? raw.glueOffsetX : undefined
  const glueOffsetY =
    typeof raw.glueOffsetY === "number" ? raw.glueOffsetY : undefined

  return {
    ...block,
    glueParentId,
    ...(glueOffsetX !== undefined ? { glueOffsetX } : {}),
    ...(glueOffsetY !== undefined ? { glueOffsetY } : {}),
  }
}
export const DEFAULT_BLOCK_FONT_SIZE = 18
export const DEFAULT_BLOCK_WIDTH = 260 / BOARD_WIDTH
export const DEFAULT_COUNTER_WIDTH = 220 / BOARD_WIDTH
export const DEFAULT_COMMENT_WIDTH = 320 / BOARD_WIDTH
export const DEFAULT_DOCK_WIDTH = DEFAULT_BLOCK_WIDTH
export const LINK_NODE_SIZE = 52
/** Layout width for link node connection anchors and drag bounds. */
export const LINK_NODE_LAYOUT_WIDTH = 224 / BOARD_WIDTH
export const DEFAULT_LINK_WIDTH = LINK_NODE_LAYOUT_WIDTH
export const DEFAULT_APPOINTMENT_WIDTH = 200 / BOARD_WIDTH
export const DEFAULT_DOCUMENT_WIDTH = 176 / BOARD_WIDTH

/** Max encoded image size stored on a comment (512 KB). */
export const COMMENT_IMAGE_MAX_BYTES = 512 * 1024

/** Longest side after compression before encoding. */
export const COMMENT_IMAGE_MAX_DIMENSION = 1200

export function isTextBlock(block: BoardBlock): block is BoardTextBlock {
  return !block.kind || block.kind === "text"
}

export function isCounterBlock(block: BoardBlock): block is BoardCounterBlock {
  return block.kind === "counter"
}

export function isCommentBlock(block: BoardBlock): block is BoardCommentBlock {
  return block.kind === "comment"
}

export function isLinkBlock(block: BoardBlock): block is BoardLinkBlock {
  return block.kind === "link"
}

export function isDockBlock(block: BoardBlock): block is BoardDockBlock {
  return block.kind === "dock"
}

export function isAppointmentBlock(block: BoardBlock): block is BoardAppointmentBlock {
  return block.kind === "appointment"
}

export function isDocumentBlock(block: BoardBlock): block is BoardDocumentBlock {
  return block.kind === "document"
}

/** "all" = any logged-in user; "author" = only the block author */
export type BoardEditMode = "all" | "author"
export const BOARD_EDIT_MODE: BoardEditMode = "all"

export type BoardEditorUser = {
  studentId: string
}

export function canEditBlock(
  block: BoardBlock,
  user: BoardEditorUser | null | undefined
): boolean {
  if (!user) return false
  if (BOARD_EDIT_MODE === "all") return true
  return block.author.studentId === user.studentId
}

export function createTextBlock(
  x: number,
  y: number,
  author: BoardAuthor
): BoardTextBlock {
  return {
    id: crypto.randomUUID(),
    kind: "text",
    text: "",
    description: "",
    x,
    y,
    width: DEFAULT_BLOCK_WIDTH,
    color: DEFAULT_BLOCK_COLOR,
    fontSize: DEFAULT_BLOCK_FONT_SIZE,
    author,
    createdAt: new Date().toISOString(),
  }
}

export function createCounterBlock(
  x: number,
  y: number,
  author: BoardAuthor
): BoardCounterBlock {
  return {
    id: crypto.randomUUID(),
    kind: "counter",
    name: "ตัวนับ",
    value: 0,
    increments: [],
    x,
    y,
    width: DEFAULT_COUNTER_WIDTH,
    author,
    createdAt: new Date().toISOString(),
  }
}

export function createCommentBlock(
  x: number,
  y: number,
  author: BoardAuthor
): BoardCommentBlock {
  return {
    id: crypto.randomUUID(),
    kind: "comment",
    title: "",
    comments: [],
    x,
    y,
    width: DEFAULT_COMMENT_WIDTH,
    color: DEFAULT_BLOCK_COLOR,
    fontSize: DEFAULT_BLOCK_FONT_SIZE,
    author,
    createdAt: new Date().toISOString(),
  }
}

export function createLinkBlock(
  x: number,
  y: number,
  author: BoardAuthor
): BoardLinkBlock {
  return {
    id: crypto.randomUUID(),
    kind: "link",
    name: "",
    url: "",
    x,
    y,
    width: DEFAULT_LINK_WIDTH,
    author,
    createdAt: new Date().toISOString(),
  }
}

export function createDockBlock(
  x: number,
  y: number,
  author: BoardAuthor
): BoardDockBlock {
  return {
    id: crypto.randomUUID(),
    kind: "dock",
    dockedBlockIds: [],
    snapToId: null,
    snapSide: null,
    x,
    y,
    width: DEFAULT_DOCK_WIDTH,
    author,
    createdAt: new Date().toISOString(),
  }
}

export function createAppointmentBlock(
  x: number,
  y: number,
  author: BoardAuthor
): BoardAppointmentBlock {
  return {
    id: crypto.randomUUID(),
    kind: "appointment",
    x,
    y,
    width: DEFAULT_APPOINTMENT_WIDTH,
    author,
    createdAt: new Date().toISOString(),
  }
}

export function createDocumentBlock(
  x: number,
  y: number,
  author: BoardAuthor
): BoardDocumentBlock {
  return {
    id: crypto.randomUUID(),
    kind: "document",
    documentId: null,
    x,
    y,
    width: DEFAULT_DOCUMENT_WIDTH,
    author,
    createdAt: new Date().toISOString(),
  }
}

function isBlockLink(value: unknown): value is BoardBlockLink {
  if (!value || typeof value !== "object") return false
  const link = value as Record<string, unknown>
  return (
    typeof link.id === "string" &&
    typeof link.name === "string" &&
    typeof link.url === "string"
  )
}

function normalizeBlockLinks(block: Record<string, unknown>): BoardBlockLink[] {
  if (Array.isArray(block.links)) {
    return block.links.filter(isBlockLink).map((link) => ({
      id: link.id,
      name: link.name,
      url: link.url,
      offsetX: typeof link.offsetX === "number" ? link.offsetX : 0,
      offsetY: typeof link.offsetY === "number" ? link.offsetY : 0,
    }))
  }

  const legacyLink = typeof block.link === "string" ? block.link.trim() : ""
  if (!legacyLink) return []

  return [
    {
      id: crypto.randomUUID(),
      name: legacyLink,
      url: legacyLink,
      offsetX: typeof block.linkNodeOffsetX === "number" ? block.linkNodeOffsetX : 0,
      offsetY: typeof block.linkNodeOffsetY === "number" ? block.linkNodeOffsetY : 0,
    },
  ]
}

function isCounterIncrement(value: unknown): value is BoardCounterIncrement {
  if (!value || typeof value !== "object") return false
  const entry = value as Record<string, unknown>
  return typeof entry.id === "string" && typeof entry.at === "string"
}

function isBlock(value: unknown): value is BoardBlock {
  if (!value || typeof value !== "object") return false
  const block = value as Record<string, unknown>
  if (
    typeof block.id !== "string" ||
    typeof block.x !== "number" ||
    typeof block.y !== "number"
  ) {
    return false
  }
  if (block.kind === "counter") {
    return typeof block.name === "string" && typeof block.value === "number"
  }
  if (block.kind === "comment") {
    return typeof block.title === "string"
  }
  if (block.kind === "link") {
    return true
  }
  if (block.kind === "dock") {
    return true
  }
  if (block.kind === "appointment") {
    return true
  }
  if (block.kind === "document") {
    return true
  }
  return typeof block.text === "string"
}

function normalizeCounterIncrements(raw: unknown): BoardCounterIncrement[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  return raw
    .filter(isCounterIncrement)
    .map((entry) => ({
      id: entry.id,
      at: entry.at,
      user: entry.user ?? {
        studentId: "ไม่ระบุ",
        displayName: "ไม่ทราบชื่อ",
      },
    }))
    .filter((entry) => {
      const studentId = entry.user.studentId
      if (seen.has(studentId)) return false
      seen.add(studentId)
      return true
    })
}

function isCommentEntry(value: unknown): value is BoardCommentEntry {
  if (!value || typeof value !== "object") return false
  const entry = value as Record<string, unknown>
  return typeof entry.id === "string" && typeof entry.text === "string"
}

function normalizeCommentEntries(raw: unknown): BoardCommentEntry[] {
  if (!Array.isArray(raw)) return []
  return raw.filter(isCommentEntry).map((entry) => ({
    id: entry.id,
    text: entry.text,
    imageDataUrl:
      typeof entry.imageDataUrl === "string" ? entry.imageDataUrl : undefined,
    user: entry.user ?? undefined,
    at: entry.at || new Date().toISOString(),
  }))
}

function normalizeCommentBlock(block: BoardCommentBlock): BoardCommentBlock {
  return {
    ...block,
    kind: "comment",
    title: block.title ?? "",
    comments: normalizeCommentEntries(block.comments),
    width: DEFAULT_COMMENT_WIDTH,
    color: resolveMessageBlockColor(block.color),
    fontSize: block.fontSize || DEFAULT_BLOCK_FONT_SIZE,
    author: block.author ?? {
      studentId: "ไม่ระบุ",
      displayName: "ไม่ทราบชื่อ",
    },
    createdAt: block.createdAt || new Date().toISOString(),
  }
}

function normalizeTextBlock(block: BoardTextBlock): BoardTextBlock {
  const {
    links: _links,
    link: _link,
    linkNodeOffsetX: _linkNodeOffsetX,
    linkNodeOffsetY: _linkNodeOffsetY,
    kind: _kind,
    ...rest
  } = block as BoardTextBlock & Record<string, unknown>

  return {
    ...(rest as BoardTextBlock),
    kind: "text",
    width: block.width || DEFAULT_BLOCK_WIDTH,
    color: resolveMessageBlockColor(block.color),
    fontSize: block.fontSize || DEFAULT_BLOCK_FONT_SIZE,
    description: block.description ?? "",
    author: block.author ?? {
      studentId: "ไม่ระบุ",
      displayName: "ไม่ทราบชื่อ",
    },
    createdAt: block.createdAt || new Date().toISOString(),
  }
}

function normalizeLinkBlock(block: BoardLinkBlock): BoardLinkBlock {
  const raw = block as BoardLinkBlock & Record<string, unknown>
  const legacyTitle = typeof raw.title === "string" ? raw.title : ""
  const name =
    typeof block.name === "string" && block.name.length > 0
      ? block.name
      : legacyTitle

  return {
    id: block.id,
    kind: "link",
    name,
    url: typeof block.url === "string" ? block.url : "",
    x: block.x,
    y: block.y,
    width: DEFAULT_LINK_WIDTH,
    author: block.author ?? {
      studentId: "ไม่ระบุ",
      displayName: "ไม่ทราบชื่อ",
    },
    createdAt: block.createdAt || new Date().toISOString(),
  }
}

const LEGACY_LINK_NODE_OFFSET = 56
const LEGACY_LINK_NODE_GAP = 20
const LEGACY_BLOCK_HEIGHT = 128

function legacyLinkNodeCenter(
  blockX: number,
  blockY: number,
  blockWidth: number,
  link: BoardBlockLink,
  linkIndex: number,
  linkCount: number
): { x: number; y: number } {
  const rectX = blockX * BOARD_WIDTH
  const rectY = blockY * BOARD_HEIGHT
  const rectW = blockWidth * BOARD_WIDTH
  const baseX = rectX + rectW + LEGACY_LINK_NODE_OFFSET + LINK_NODE_SIZE / 2
  const centerY = rectY + LEGACY_BLOCK_HEIGHT / 2
  const spacing = LINK_NODE_SIZE + LEGACY_LINK_NODE_GAP
  const offsetIndex = linkIndex - (linkCount - 1) / 2

  return {
    x: baseX + link.offsetX * BOARD_WIDTH,
    y: centerY + offsetIndex * spacing + link.offsetY * BOARD_HEIGHT,
  }
}

function linkNodeTopLeftFromCenter(centerX: number, centerY: number) {
  return {
    x: (centerX - LINK_NODE_SIZE / 2) / BOARD_WIDTH,
    y: (centerY - LINK_NODE_SIZE / 2) / BOARD_HEIGHT,
  }
}

function expandLegacyLinkBlock(item: BoardLinkBlock): BoardLinkBlock[] {
  const raw = item as BoardLinkBlock & Record<string, unknown>
  const hasNewShape =
    typeof raw.name === "string" &&
    typeof raw.url === "string" &&
    !Array.isArray(raw.links)

  if (hasNewShape) {
    return [normalizeLinkBlock(item)]
  }

  const links = normalizeBlockLinks(raw)
  if (links.length === 0) {
    return [normalizeLinkBlock(item)]
  }

  return links.map((link, linkIndex) => {
    const center = legacyLinkNodeCenter(
      item.x,
      item.y,
      item.width || DEFAULT_LINK_WIDTH,
      link,
      linkIndex,
      links.length
    )
    const pos = linkNodeTopLeftFromCenter(center.x, center.y)

    return normalizeLinkBlock({
      id: links.length === 1 ? item.id : crypto.randomUUID(),
      kind: "link",
      name: link.name,
      url: link.url,
      x: pos.x,
      y: pos.y,
      width: DEFAULT_LINK_WIDTH,
      author: item.author,
      createdAt: item.createdAt,
    })
  })
}

function legacyTextLinksToLinkBlocks(
  textBlock: BoardTextBlock,
  links: BoardBlockLink[]
): BoardLinkBlock[] {
  const blockWidth = textBlock.width || DEFAULT_BLOCK_WIDTH

  return links.map((link, linkIndex) => {
    const center = legacyLinkNodeCenter(
      textBlock.x,
      textBlock.y,
      blockWidth,
      link,
      linkIndex,
      links.length
    )
    const pos = linkNodeTopLeftFromCenter(center.x, center.y)

    return normalizeLinkBlock({
      id: crypto.randomUUID(),
      kind: "link",
      name: link.name,
      url: link.url,
      x: pos.x,
      y: pos.y,
      width: DEFAULT_LINK_WIDTH,
      author: textBlock.author,
      createdAt: textBlock.createdAt,
    })
  })
}

function normalizeAppointmentBlock(block: BoardAppointmentBlock): BoardAppointmentBlock {
  return {
    id: block.id,
    kind: "appointment",
    x: block.x,
    y: block.y,
    width: DEFAULT_APPOINTMENT_WIDTH,
    author: block.author ?? {
      studentId: "ไม่ระบุ",
      displayName: "ไม่ทราบชื่อ",
    },
    createdAt: block.createdAt || new Date().toISOString(),
  }
}

function normalizeDocumentBlock(block: BoardDocumentBlock): BoardDocumentBlock {
  const raw = block as BoardDocumentBlock & Record<string, unknown>
  const documentId =
    typeof raw.documentId === "string" && raw.documentId.trim().length > 0
      ? raw.documentId.trim()
      : null

  return {
    id: block.id,
    kind: "document",
    documentId,
    x: block.x,
    y: block.y,
    width: DEFAULT_DOCUMENT_WIDTH,
    author: block.author ?? {
      studentId: "ไม่ระบุ",
      displayName: "ไม่ทราบชื่อ",
    },
    createdAt: block.createdAt || new Date().toISOString(),
  }
}

function normalizeDockBlock(block: BoardDockBlock): BoardDockBlock {
  const raw = block as BoardDockBlock & Record<string, unknown>
  const dockedBlockIds = Array.isArray(raw.dockedBlockIds)
    ? raw.dockedBlockIds.filter((id): id is string => typeof id === "string")
    : []

  const snapToId = typeof raw.snapToId === "string" ? raw.snapToId : null
  const snapSide =
    raw.snapSide === "above" || raw.snapSide === "below"
      ? raw.snapSide
      : snapToId
        ? "above"
        : null

  return {
    id: block.id,
    kind: "dock",
    dockedBlockIds,
    snapToId,
    snapSide,
    x: block.x,
    y: block.y,
    width: DEFAULT_DOCK_WIDTH,
    author: block.author ?? {
      studentId: "ไม่ระบุ",
      displayName: "ไม่ทราบชื่อ",
    },
    createdAt: block.createdAt || new Date().toISOString(),
  }
}

function normalizeCounterBlock(block: BoardCounterBlock): BoardCounterBlock {
  const increments = normalizeCounterIncrements(block.increments)
  return {
    ...block,
    kind: "counter",
    name: block.name ?? "ตัวนับ",
    increments,
    value: increments.length,
    width: DEFAULT_COUNTER_WIDTH,
    author: block.author ?? {
      studentId: "ไม่ระบุ",
      displayName: "ไม่ทราบชื่อ",
    },
    createdAt: block.createdAt || new Date().toISOString(),
  }
}

/** Ensures counter blocks use the canonical width before persisting. */
export function normalizeBoardBlocksForSave(blocks: BoardBlock[]): BoardBlock[] {
  return blocks.map((block) => {
    if (isCounterBlock(block)) return { ...block, width: DEFAULT_COUNTER_WIDTH }
    if (isCommentBlock(block)) {
      return {
        ...block,
        width: DEFAULT_COMMENT_WIDTH,
        color: resolveMessageBlockColor(block.color),
      }
    }
    if (isLinkBlock(block)) return { ...block, width: DEFAULT_LINK_WIDTH }
    if (isDockBlock(block)) return { ...block, width: DEFAULT_DOCK_WIDTH }
    if (isAppointmentBlock(block)) return { ...block, width: DEFAULT_APPOINTMENT_WIDTH }
    if (isDocumentBlock(block)) return { ...block, width: DEFAULT_DOCUMENT_WIDTH }
    if (isTextBlock(block)) {
      return {
        ...block,
        color: resolveMessageBlockColor(block.color),
      }
    }
    return block
  })
}

function isConnection(value: unknown): value is BoardConnection {
  if (!value || typeof value !== "object") return false
  const connection = value as Record<string, unknown>
  return (
    typeof connection.id === "string" &&
    typeof connection.fromId === "string" &&
    typeof connection.toId === "string"
  )
}

export function normalizeBlocks(raw: unknown): BoardBlock[] {
  if (!Array.isArray(raw)) return []

  const result: BoardBlock[] = []
  const seenBlockIds = new Set<string>()

  for (const item of raw) {
    if (!isBlock(item)) continue

    if (isCounterBlock(item)) {
      result.push(normalizeCounterBlock(item))
      continue
    }
    if (isCommentBlock(item)) {
      result.push(normalizeCommentBlock(item))
      continue
    }
    if (isLinkBlock(item)) {
      for (const linkBlock of expandLegacyLinkBlock(item)) {
        if (seenBlockIds.has(linkBlock.id)) continue
        seenBlockIds.add(linkBlock.id)
        result.push(linkBlock)
      }
      continue
    }
    if (isDockBlock(item)) {
      const normalized = normalizeDockBlock(item)
      if (seenBlockIds.has(normalized.id)) continue
      seenBlockIds.add(normalized.id)
      result.push(normalized)
      continue
    }
    if (isAppointmentBlock(item)) {
      const normalized = normalizeAppointmentBlock(item)
      if (seenBlockIds.has(normalized.id)) continue
      seenBlockIds.add(normalized.id)
      result.push(normalized)
      continue
    }
    if (isDocumentBlock(item)) {
      const normalized = normalizeDocumentBlock(item)
      if (seenBlockIds.has(normalized.id)) continue
      seenBlockIds.add(normalized.id)
      result.push(normalized)
      continue
    }

    const textBlock = normalizeTextBlock(item)
    result.push(textBlock)

    const shouldMigrateLegacyLinks = item.kind !== "text"
    const legacyLinks = shouldMigrateLegacyLinks
      ? normalizeBlockLinks(item as Record<string, unknown>)
      : []

    if (legacyLinks.length > 0) {
      for (const linkBlock of legacyTextLinksToLinkBlocks(textBlock, legacyLinks)) {
        if (seenBlockIds.has(linkBlock.id)) continue
        seenBlockIds.add(linkBlock.id)
        result.push(linkBlock)
      }
    }
  }

  return result.map((block) => normalizeGlueFields(block))
}

export function normalizeConnections(raw: unknown): BoardConnection[] {
  if (!Array.isArray(raw)) return []
  return raw.filter(isConnection).map((connection) => {
    const extra = connection as BoardConnection & Record<string, unknown>
    const tone = extra.tone
    const normalizedTone =
      tone === "red" || tone === "blue" || tone === "neutral" ? tone : "neutral"

    return {
      id: connection.id,
      fromId: connection.fromId,
      toId: connection.toId,
      createdAt: connection.createdAt || new Date().toISOString(),
      appointmentId:
        typeof extra.appointmentId === "string" ? extra.appointmentId : null,
      tone: normalizedTone,
      customTagLabel:
        typeof extra.customTagLabel === "string" ? extra.customTagLabel : null,
      customTagColor:
        typeof extra.customTagLabel === "string" && typeof extra.customTagColor === "string"
          ? extra.customTagColor
          : null,
    }
  })
}

export function recordToBoardContent(record: AnnouncementBoardRecord): BoardContent {
  return {
    blocks: normalizeBlocks(record.blocks),
    connections: normalizeConnections(record.connections),
    updatedAt: record.updated_at ?? null,
  }
}

function collectLinkedAppointmentIds(
  rows: Array<{ connections: unknown }>
): Set<string> {
  const ids = new Set<string>()
  for (const row of rows) {
    for (const connection of normalizeConnections(row.connections)) {
      if (connection.appointmentId) {
        ids.add(connection.appointmentId)
      }
    }
  }
  return ids
}

export async function fetchLinkedAppointmentIds(): Promise<Set<string>> {
  const { data, error } = await supabase.from("announcement_boards").select("connections")
  if (error) throw error
  return collectLinkedAppointmentIds(data ?? [])
}

export async function isAppointmentLinkedOnBoard(appointmentId: string): Promise<boolean> {
  const linkedIds = await fetchLinkedAppointmentIds()
  return linkedIds.has(appointmentId)
}

export async function fetchBoard(
  announcementId: string
): Promise<AnnouncementBoardRecord | null> {
  const { data, error } = await supabase
    .from("announcement_boards")
    .select("announcement_id, blocks, connections, updated_at")
    .eq("announcement_id", announcementId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    announcement_id: data.announcement_id,
    blocks: normalizeBlocks(data.blocks),
    connections: normalizeConnections(data.connections),
    updated_at: data.updated_at,
  }
}

export async function createBoard(
  input: SaveBoardInput
): Promise<AnnouncementBoardRecord> {
  const { data, error } = await supabase
    .from("announcement_boards")
    .insert({
      announcement_id: input.announcementId,
      blocks: input.blocks,
      connections: input.connections,
    })
    .select("announcement_id, blocks, connections, updated_at")
    .single()

  if (error) throw error

  return {
    announcement_id: data.announcement_id,
    blocks: normalizeBlocks(data.blocks),
    connections: normalizeConnections(data.connections),
    updated_at: data.updated_at,
  }
}

export async function updateBoard(
  input: SaveBoardInput
): Promise<AnnouncementBoardRecord> {
  const { data, error } = await supabase
    .from("announcement_boards")
    .update({
      blocks: input.blocks,
      connections: input.connections,
      updated_at: new Date().toISOString(),
    })
    .eq("announcement_id", input.announcementId)
    .select("announcement_id, blocks, connections, updated_at")
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new Error("บันทึกบอร์ดไม่สำเร็จ — ไม่พบบอร์ดของประกาศนี้")
  }

  return {
    announcement_id: data.announcement_id,
    blocks: normalizeBlocks(data.blocks),
    connections: normalizeConnections(data.connections),
    updated_at: data.updated_at,
  }
}
