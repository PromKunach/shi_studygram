"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import {
  CreateDocumentDialog,
  EditDocumentDialog,
  type CreateDocumentPayload,
} from "@/components/documents/create-document-dialog";
import { CreateSectionDialog } from "@/components/documents/create-section-dialog";
import type { DocumentItem } from "@/components/documents/document-card";
import {
  DocumentSectionRow,
  type DocumentSection,
} from "@/components/documents/document-section-row";
import { DocumentsSectionsSkeleton } from "@/components/documents/documents-page-skeleton";
import { Input } from "@/components/ui/input";
import {
  createDocumentNode,
  createDocumentSection,
  deleteDocumentNode,
  fetchDocumentWorkspace,
  updateDocumentNode,
} from "@/lib/documents";
import { sortDocumentsWithFoldersFirst } from "@/lib/document-icons";
import { PAGE_MAIN } from "@/lib/layout";
import { PAGE_META } from "@/lib/navigation";
import { getAuthorPbriId, useCurrentUser } from "@/lib/userProfile";
import { cn } from "@/lib/utils";

const pageTitle = PAGE_META["/documents"]?.label ?? "เอกสาร";

function matchesSearch(section: DocumentSection, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  if (section.title.toLowerCase().includes(normalized)) return true;

  return section.documents.some((document) =>
    document.title.toLowerCase().includes(normalized)
  );
}

export default function DocumentsPage() {
  const { user, ready } = useCurrentUser();
  const authorPbriId = getAuthorPbriId(user);

  const [sections, setSections] = useState<DocumentSection[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateSectionOpen, setIsCreateSectionOpen] = useState(false);
  const [createDocumentSectionId, setCreateDocumentSectionId] = useState<
    string | null
  >(null);
  const [editingDocument, setEditingDocument] = useState<DocumentItem | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadWorkspace = useCallback(async (options?: { silent?: boolean }) => {
    setLoadError(null);
    if (!options?.silent) setIsLoading(true);

    try {
      const nextSections = await fetchDocumentWorkspace(authorPbriId);
      setSections(nextSections);
      setHasLoaded(true);
    } catch (error) {
      console.error(error);
      setLoadError("โหลดเอกสารไม่สำเร็จ");
    } finally {
      setIsLoading(false);
    }
  }, [authorPbriId]);

  useEffect(() => {
    if (!ready) return;
    void loadWorkspace();
  }, [ready, loadWorkspace]);

  const filteredSections = useMemo(
    () => sections.filter((section) => matchesSearch(section, searchQuery)),
    [sections, searchQuery]
  );

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

  const openCreateDocument = (sectionId: string) => {
    setCreateDocumentSectionId(sectionId);
  };

  const handleCreateDocument = async (payload: CreateDocumentPayload) => {
    if (!createDocumentSectionId) return;

    setIsSaving(true);
    setLoadError(null);

    try {
      const created = await createDocumentNode(
        authorPbriId,
        createDocumentSectionId,
        payload
      );

      setSections((current) =>
        current.map((section) => {
          if (section.id !== createDocumentSectionId) return section;
          return {
            ...section,
            documents: sortDocumentsWithFoldersFirst([
              ...section.documents,
              created,
            ]),
          };
        })
      );
      setCreateDocumentSectionId(null);
    } catch (error) {
      console.error(error);
      setLoadError("สร้างเอกสารไม่สำเร็จ");
    } finally {
      setIsSaving(false);
    }
  };

  const addDocument = (sectionId: string) => {
    openCreateDocument(sectionId);
  };

  const handleUpdateDocument = async (payload: CreateDocumentPayload) => {
    if (!editingDocument) return;

    setIsSaving(true);
    setLoadError(null);

    try {
      const updated = await updateDocumentNode(
        authorPbriId,
        editingDocument.id,
        payload
      );

      setSections((current) =>
        current.map((section) => ({
          ...section,
          documents: sortDocumentsWithFoldersFirst(
            section.documents.map((document) =>
              document.id === updated.id ? updated : document
            )
          ),
        }))
      );
      setEditingDocument(null);
    } catch (error) {
      console.error(error);
      setLoadError("บันทึกการแก้ไขไม่สำเร็จ");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDocument = async () => {
    if (!editingDocument) return;

    setIsSaving(true);
    setLoadError(null);

    try {
      await deleteDocumentNode(authorPbriId, editingDocument.id);

      setSections((current) =>
        current.map((section) => ({
          ...section,
          documents: section.documents.filter(
            (document) => document.id !== editingDocument.id
          ),
        }))
      );
      setEditingDocument(null);
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
        <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center">
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
          <div className="space-y-10">
            {filteredSections.map((section) => (
              <DocumentSectionRow
                key={section.id}
                section={section}
                onNewDocument={addDocument}
                onEditDocument={setEditingDocument}
              />
            ))}
          </div>
        )}
      </div>

      <CreateSectionDialog
        open={isCreateSectionOpen}
        onClose={() => setIsCreateSectionOpen(false)}
        onSubmit={handleCreateSection}
      />

      <CreateDocumentDialog
        open={createDocumentSectionId !== null}
        onClose={() => setCreateDocumentSectionId(null)}
        onSubmit={handleCreateDocument}
        isBusy={isSaving}
      />

      {editingDocument && (
        <EditDocumentDialog
          open
          document={editingDocument}
          onClose={() => setEditingDocument(null)}
          onSubmit={handleUpdateDocument}
          onDelete={() => void handleDeleteDocument()}
          isBusy={isSaving}
        />
      )}
    </main>
  );
}
