"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import {
  CreateDocumentDialog,
  EditDocumentDialog,
  type CreateDocumentPayload,
} from "@/components/documents/create-document-dialog";
import { CreateSectionDialog } from "@/components/documents/create-section-dialog";
import { GoogleDrivePreviewModal } from "@/components/documents/document-google-drive-inline";
import type { DocumentItem } from "@/components/documents/document-card";
import {
  DocumentSectionRow,
  type DocumentSection,
} from "@/components/documents/document-section-row";
import { DocumentsSectionsSkeleton } from "@/components/documents/documents-page-skeleton";
import { Input } from "@/components/ui/input";
import {
  buildSectionBreadcrumb,
  createDocumentNode,
  createDocumentSection,
  deleteDocumentNode,
  fetchDocumentWorkspace,
  getNodeChildren,
  updateDocumentNode,
  type DocumentNodeRecord,
} from "@/lib/documents";
import { PAGE_MAIN } from "@/lib/layout";
import { PAGE_META } from "@/lib/navigation";
import { getAuthorPbriId, useCurrentUser } from "@/lib/userProfile";
import { cn } from "@/lib/utils";

const pageTitle = PAGE_META["/documents"]?.label ?? "เอกสาร";

function matchesSearch(
  section: DocumentSection,
  documents: DocumentItem[],
  breadcrumbTitles: string[],
  query: string
) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  if (breadcrumbTitles.some((title) => title.toLowerCase().includes(normalized))) {
    return true;
  }

  if (section.title.toLowerCase().includes(normalized)) return true;

  return documents.some((document) => {
    const haystack = `${document.title} ${document.description ?? ""}`.toLowerCase();
    return haystack.includes(normalized);
  });
}

function pruneFolderStack(
  stack: string[],
  nodes: DocumentNodeRecord[]
): string[] {
  const next: string[] = [];

  for (const folderId of stack) {
    const folder = nodes.find(
      (node) => node.id === folderId && node.kind === "folder"
    );
    if (!folder) break;
    next.push(folderId);
  }

  return next;
}

export default function DocumentsPage() {
  const { user, ready } = useCurrentUser();
  const authorPbriId = getAuthorPbriId(user);

  const [sections, setSections] = useState<DocumentSection[]>([]);
  const [nodes, setNodes] = useState<DocumentNodeRecord[]>([]);
  const [folderStackBySection, setFolderStackBySection] = useState<
    Record<string, string[]>
  >({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateSectionOpen, setIsCreateSectionOpen] = useState(false);
  const [createDocumentParentId, setCreateDocumentParentId] = useState<
    string | null
  >(null);
  const [editingDocument, setEditingDocument] = useState<DocumentItem | null>(
    null
  );
  const [editingFocusField, setEditingFocusField] = useState<
    "description" | null
  >(null);
  const [drivePreview, setDrivePreview] = useState<{
    name: string;
    url: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadWorkspace = useCallback(async (options?: { silent?: boolean }) => {
    setLoadError(null);
    if (!options?.silent) setIsLoading(true);

    try {
      const workspace = await fetchDocumentWorkspace();
      setSections(workspace.sections);
      setNodes(workspace.nodes);
      setFolderStackBySection((current) => {
        const next: Record<string, string[]> = {};
        for (const section of workspace.sections) {
          next[section.id] = pruneFolderStack(
            current[section.id] ?? [],
            workspace.nodes
          );
        }
        return next;
      });
      setHasLoaded(true);
    } catch (error) {
      console.error(error);
      setLoadError("โหลดเอกสารไม่สำเร็จ");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    void loadWorkspace();
  }, [ready, loadWorkspace]);

  const getActiveParentId = useCallback(
    (sectionId: string) => {
      const stack = folderStackBySection[sectionId] ?? [];
      return stack.length > 0 ? stack[stack.length - 1]! : sectionId;
    },
    [folderStackBySection]
  );

  const filteredSections = useMemo(() => {
    return sections.filter((section) => {
      const stack = folderStackBySection[section.id] ?? [];
      const breadcrumb = buildSectionBreadcrumb(section, nodes, stack);
      const documents = getNodeChildren(nodes, getActiveParentId(section.id));
      return matchesSearch(
        section,
        documents,
        breadcrumb.map((segment) => segment.title),
        searchQuery
      );
    });
  }, [sections, nodes, folderStackBySection, searchQuery, getActiveParentId]);

  const openCreateSection = () => setIsCreateSectionOpen(true);

  const handleCreateSection = async (name: string) => {
    setIsSaving(true);
    setLoadError(null);

    try {
      await createDocumentSection(authorPbriId, name);
      await loadWorkspace({ silent: true });
      setIsCreateSectionOpen(false);
    } catch (error) {
      console.error(error);
      setLoadError("สร้างส่วนไม่สำเร็จ");
    } finally {
      setIsSaving(false);
    }
  };

  const openCreateDocument = (parentId: string) => {
    setCreateDocumentParentId(parentId);
  };

  const handleCreateDocument = async (payload: CreateDocumentPayload) => {
    if (!createDocumentParentId) return;

    setIsSaving(true);
    setLoadError(null);

    try {
      await createDocumentNode(authorPbriId, createDocumentParentId, payload);
      await loadWorkspace({ silent: true });
      setCreateDocumentParentId(null);
    } catch (error) {
      console.error(error);
      setLoadError("สร้างเอกสารไม่สำเร็จ");
    } finally {
      setIsSaving(false);
    }
  };

  const enterFolder = (sectionId: string, folder: DocumentItem) => {
    if (folder.type !== "folder") return;

    setFolderStackBySection((current) => ({
      ...current,
      [sectionId]: [...(current[sectionId] ?? []), folder.id],
    }));
  };

  const navigateBreadcrumb = (sectionId: string, index: number) => {
    setFolderStackBySection((current) => ({
      ...current,
      [sectionId]:
        index === 0 ? [] : (current[sectionId] ?? []).slice(0, index),
    }));
  };

  const handleUpdateDocument = async (payload: CreateDocumentPayload) => {
    if (!editingDocument) return;

    setIsSaving(true);
    setLoadError(null);

    try {
      await updateDocumentNode(editingDocument.id, payload);
      await loadWorkspace({ silent: true });
      setEditingDocument(null);
      setEditingFocusField(null);
    } catch (error) {
      console.error(error);
      setLoadError("บันทึกการแก้ไขไม่สำเร็จ");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDocument = async (target?: DocumentItem | null) => {
    const documentToDelete = target ?? editingDocument;
    if (!documentToDelete) return;

    setIsSaving(true);
    setLoadError(null);

    try {
      await deleteDocumentNode(documentToDelete.id);

      setFolderStackBySection((current) => {
        const next: Record<string, string[]> = {};
        for (const [sectionId, stack] of Object.entries(current)) {
          const filtered = stack.filter((id) => id !== documentToDelete.id);
          if (
            documentToDelete.type === "folder" &&
            stack.includes(documentToDelete.id)
          ) {
            const cutIndex = stack.indexOf(documentToDelete.id);
            next[sectionId] = stack.slice(0, cutIndex);
          } else {
            next[sectionId] = filtered;
          }
        }
        return next;
      });

      await loadWorkspace({ silent: true });

      if (editingDocument?.id === documentToDelete.id) {
        setEditingDocument(null);
      }
    } catch (error) {
      console.error(error);
      setLoadError("ลบไม่สำเร็จ");
    } finally {
      setIsSaving(false);
    }
  };

  const isWorkspaceLoading = !ready || (isLoading && !hasLoaded);

  return (
    <main className={cn(PAGE_MAIN)}>
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
          <h1 className="shrink-0 text-xl font-semibold text-foreground sm:text-2xl">
            {pageTitle}
          </h1>

          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="ค้นหาส่วนหรือเอกสาร..."
              className="h-10 bg-sidebar pl-9 shadow-none"
              aria-label="ค้นหาเอกสาร"
              disabled={isWorkspaceLoading}
            />
          </div>

          <button
            type="button"
            onClick={openCreateSection}
            disabled={isSaving || isWorkspaceLoading}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-hover disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            เพิ่มส่วน
          </button>
        </header>

        {loadError && (
          <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {loadError}
          </div>
        )}

        {isWorkspaceLoading ? (
          <DocumentsSectionsSkeleton />
        ) : sections.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-sidebar px-6 py-14 text-center">
            <p className="text-sm text-muted">ยังไม่มีส่วนเอกสาร</p>
            <button
              type="button"
              onClick={openCreateSection}
              className="mt-4 text-sm font-medium text-foreground hover:underline"
            >
              + สร้างส่วนแรก
            </button>
          </div>
        ) : filteredSections.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-sidebar px-6 py-14 text-center">
            <p className="text-sm text-muted">ไม่พบส่วนที่ตรงกับการค้นหา</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredSections.map((section) => {
              const stack = folderStackBySection[section.id] ?? [];
              const breadcrumb = buildSectionBreadcrumb(section, nodes, stack);
              const activeParentId = getActiveParentId(section.id);
              const documents = getNodeChildren(nodes, activeParentId);

              return (
                <DocumentSectionRow
                  key={section.id}
                  section={section}
                  documents={documents}
                  breadcrumb={breadcrumb}
                  activeParentId={activeParentId}
                  onNavigateBreadcrumb={(index) =>
                    navigateBreadcrumb(section.id, index)
                  }
                  onNewDocument={openCreateDocument}
                  onOpenFolder={(folder) => enterFolder(section.id, folder)}
                  onOpenDriveDocument={(document) => {
                    if (!document.driveUrl) return;
                    setDrivePreview({
                      name: document.title,
                      url: document.driveUrl,
                    });
                  }}
                  onEditDocument={(document) => {
                    setEditingFocusField(null);
                    setEditingDocument(document);
                  }}
                  onEditDocumentDescription={(document) => {
                    setEditingFocusField("description");
                    setEditingDocument(document);
                  }}
                  onDeleteDocument={(document) =>
                    void handleDeleteDocument(document)
                  }
                  isSaving={isSaving}
                />
              );
            })}
          </div>
        )}
      </div>

      <CreateSectionDialog
        open={isCreateSectionOpen}
        onClose={() => setIsCreateSectionOpen(false)}
        onSubmit={handleCreateSection}
      />

      <CreateDocumentDialog
        open={createDocumentParentId !== null}
        onClose={() => setCreateDocumentParentId(null)}
        onSubmit={handleCreateDocument}
        isBusy={isSaving}
      />

      {editingDocument && (
        <EditDocumentDialog
          open
          document={editingDocument}
          focusField={editingFocusField ?? undefined}
          onClose={() => {
            setEditingDocument(null);
            setEditingFocusField(null);
          }}
          onSubmit={handleUpdateDocument}
          onDelete={() => void handleDeleteDocument()}
          isBusy={isSaving}
        />
      )}

      <GoogleDrivePreviewModal
        open={drivePreview !== null}
        name={drivePreview?.name ?? ""}
        url={drivePreview?.url ?? ""}
        onClose={() => setDrivePreview(null)}
      />
    </main>
  );
}
