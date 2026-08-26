import type { CreateDocumentPayload } from "@/components/documents/create-document-dialog";
import type { DocumentItem } from "@/components/documents/document-card";
import type { DocumentSection } from "@/components/documents/document-section-row";
import type { DocumentColorId } from "@/lib/document-colors";
import type { DocumentIconId } from "@/lib/document-icons";
import { sortDocumentsWithFoldersFirst } from "@/lib/document-icons";
import { isDocumentNodeId } from "@/lib/document-ids";
import { supabase } from "@/lib/supabaseClient";

export type DocumentNodeKind = "section" | "folder" | "page";

export type DocumentNodeRecord = {
  id: string;
  author_pbri_id: string;
  parent_id: string | null;
  kind: DocumentNodeKind;
  title: string;
  content: string;
  drive_url: string;
  icon: string;
  color: string;
  position: number;
  created_at: string;
  updated_at: string;
};

function formatUpdatedAt(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
  });
}

function toDocumentItem(row: DocumentNodeRecord): DocumentItem {
  return {
    id: row.id,
    title: row.title,
    type: row.kind === "folder" ? "folder" : "document",
    icon: row.icon as DocumentIconId,
    color: row.color as DocumentColorId,
    updatedAt: formatUpdatedAt(row.updated_at),
    driveUrl: row.kind === "page" ? row.drive_url?.trim() || undefined : undefined,
  };
}

export function hasDocumentDriveLink(
  document: Pick<DocumentItem, "type" | "driveUrl">
) {
  return document.type === "document" && Boolean(document.driveUrl?.trim());
}

export function buildDocumentSections(
  nodes: DocumentNodeRecord[]
): DocumentSection[] {
  const sections = nodes
    .filter((node) => node.kind === "section")
    .sort((left, right) => left.position - right.position);

  return sections.map((section) => {
    const documents = sortDocumentsWithFoldersFirst(
      nodes
        .filter(
          (node) =>
            node.parent_id === section.id &&
            (node.kind === "folder" || node.kind === "page")
        )
        .map(toDocumentItem)
    );

    return {
      id: section.id,
      title: section.title,
      documents,
    };
  });
}

async function getNextSiblingPosition(parentId: string | null) {
  let query = supabase
    .from("document_nodes")
    .select("position")
    .order("position", { ascending: false })
    .limit(1);

  query =
    parentId === null
      ? query.is("parent_id", null).eq("kind", "section")
      : query.eq("parent_id", parentId);

  const { data, error } = await query;

  if (error) throw error;
  return (data?.[0]?.position ?? -1) + 1;
}

export type DocumentBreadcrumbSegment = {
  id: string;
  title: string;
};

export async function fetchAllDocumentNodes() {
  const { data, error } = await supabase
    .from("document_nodes")
    .select("*")
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as DocumentNodeRecord[];
}

/** @deprecated Use fetchAllDocumentNodes — documents are shared publicly. */
export async function fetchDocumentNodes(_authorPbriId?: string) {
  return fetchAllDocumentNodes();
}

export function getNodeChildren(
  nodes: DocumentNodeRecord[],
  parentId: string
): DocumentItem[] {
  return sortDocumentsWithFoldersFirst(
    nodes
      .filter(
        (node) =>
          node.parent_id === parentId &&
          (node.kind === "folder" || node.kind === "page")
      )
      .map(toDocumentItem)
  );
}

export function buildSectionBreadcrumb(
  section: Pick<DocumentSection, "id" | "title">,
  nodes: DocumentNodeRecord[],
  folderStack: string[]
): DocumentBreadcrumbSegment[] {
  const segments: DocumentBreadcrumbSegment[] = [
    { id: section.id, title: section.title },
  ];

  for (const folderId of folderStack) {
    const folder = nodes.find(
      (node) => node.id === folderId && node.kind === "folder"
    );
    if (!folder) break;
    segments.push({ id: folder.id, title: folder.title });
  }

  return segments;
}

export async function fetchDocumentWorkspace() {
  const nodes = await fetchAllDocumentNodes();
  return {
    sections: buildDocumentSections(nodes),
    nodes,
  };
}

export async function createDocumentSection(
  authorPbriId: string,
  title: string
) {
  const position = await getNextSiblingPosition(null);

  const { data, error } = await supabase
    .from("document_nodes")
    .insert({
      author_pbri_id: authorPbriId,
      kind: "section",
      title: title.trim(),
      icon: "folder",
      color: "none",
      position,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as DocumentNodeRecord;
}

export async function fetchDocumentNode(nodeId: string) {
  const id = nodeId.trim();
  if (!isDocumentNodeId(id)) return null;

  const { data, error } = await supabase
    .from("document_nodes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return (data as DocumentNodeRecord | null) ?? null;
}

export async function updateDocumentNode(
  nodeId: string,
  payload: CreateDocumentPayload
) {
  const { data, error } = await supabase
    .from("document_nodes")
    .update({
      kind: payload.type === "folder" ? "folder" : "page",
      title: payload.title.trim(),
      icon: payload.icon,
      color: payload.color,
      drive_url:
        payload.type === "folder" ? "" : (payload.driveUrl ?? "").trim(),
    })
    .eq("id", nodeId)
    .select("*")
    .single();

  if (error) throw error;
  return toDocumentItem(data as DocumentNodeRecord);
}

export async function updateDocumentPage(
  nodeId: string,
  patch: { title?: string; content?: string }
) {
  const updates: { title?: string; content?: string } = {};

  if (patch.title !== undefined) {
    const trimmed = patch.title.trim();
    if (!trimmed) throw new Error("title cannot be blank");
    updates.title = trimmed;
  }

  if (patch.content !== undefined) {
    updates.content = patch.content;
  }

  if (Object.keys(updates).length === 0) return;

  const { data, error } = await supabase
    .from("document_nodes")
    .update(updates)
    .eq("id", nodeId)
    .eq("kind", "page")
    .select("*")
    .single();

  if (error) throw error;
  return data as DocumentNodeRecord;
}

export async function deleteDocumentNode(nodeId: string) {
  const { error } = await supabase.from("document_nodes").delete().eq("id", nodeId);

  if (error) throw error;
}

export async function createDocumentNode(
  authorPbriId: string,
  parentId: string,
  payload: CreateDocumentPayload
) {
  const position = await getNextSiblingPosition(parentId);

  const { data, error } = await supabase
    .from("document_nodes")
    .insert({
      author_pbri_id: authorPbriId,
      parent_id: parentId,
      kind: payload.type === "folder" ? "folder" : "page",
      title: payload.title.trim(),
      icon: payload.icon,
      color: payload.color,
      drive_url:
        payload.type === "folder" ? "" : (payload.driveUrl ?? "").trim(),
      position,
    })
    .select("*")
    .single();

  if (error) throw error;
  return toDocumentItem(data as DocumentNodeRecord);
}

/** List direct children of a folder (nested navigation). */
export async function fetchDocumentNodeChildren(parentId: string) {
  const { data, error } = await supabase
    .from("document_nodes")
    .select("*")
    .eq("parent_id", parentId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;

  return sortDocumentsWithFoldersFirst(
    ((data ?? []) as DocumentNodeRecord[]).map(toDocumentItem)
  );
}
