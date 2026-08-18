import type { CreateDocumentPayload } from "@/components/documents/create-document-dialog";
import type { DocumentItem } from "@/components/documents/document-card";
import type { DocumentSection } from "@/components/documents/document-section-row";
import type { DocumentColorId } from "@/lib/document-colors";
import type { DocumentIconId } from "@/lib/document-icons";
import { sortDocumentsWithFoldersFirst } from "@/lib/document-icons";
import { supabase } from "@/lib/supabaseClient";

export type DocumentNodeKind = "section" | "folder" | "page";

export type DocumentNodeRecord = {
  id: string;
  author_pbri_id: string;
  parent_id: string | null;
  kind: DocumentNodeKind;
  title: string;
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
  };
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

async function getNextSiblingPosition(parentId: string | null, authorPbriId: string) {
  let query = supabase
    .from("document_nodes")
    .select("position")
    .eq("author_pbri_id", authorPbriId)
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

export async function fetchDocumentWorkspace(authorPbriId: string) {
  const { data, error } = await supabase
    .from("document_nodes")
    .select("*")
    .eq("author_pbri_id", authorPbriId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;

  const nodes = (data ?? []) as DocumentNodeRecord[];
  return buildDocumentSections(nodes);
}

export async function createDocumentSection(
  authorPbriId: string,
  title: string
) {
  const position = await getNextSiblingPosition(null, authorPbriId);

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

export async function createDocumentNode(
  authorPbriId: string,
  parentId: string,
  payload: CreateDocumentPayload
) {
  const position = await getNextSiblingPosition(parentId, authorPbriId);

  const { data, error } = await supabase
    .from("document_nodes")
    .insert({
      author_pbri_id: authorPbriId,
      parent_id: parentId,
      kind: payload.type === "folder" ? "folder" : "page",
      title: payload.title.trim(),
      icon: payload.icon,
      color: payload.color,
      position,
    })
    .select("*")
    .single();

  if (error) throw error;
  return toDocumentItem(data as DocumentNodeRecord);
}

/** Future: list direct children of a folder (nested navigation). */
export async function fetchDocumentNodeChildren(
  authorPbriId: string,
  parentId: string
) {
  const { data, error } = await supabase
    .from("document_nodes")
    .select("*")
    .eq("author_pbri_id", authorPbriId)
    .eq("parent_id", parentId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;

  return sortDocumentsWithFoldersFirst(
    ((data ?? []) as DocumentNodeRecord[]).map(toDocumentItem)
  );
}
