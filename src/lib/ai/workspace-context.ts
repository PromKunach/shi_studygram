import {
  buildDocumentSearchCatalog,
  buildSectionSearchContext,
} from "@/lib/ai/document-search-core";
import type { DocumentNodeRecord } from "@/lib/documents";

export type AiWorkspaceContext = {
  app: string;
  features: string[];
  search: {
    matches: string[];
    tip: string;
  };
  pages: Array<{
    title: string;
    section?: string;
    location?: string;
    description?: string;
  }>;
  sections: Array<{
    title: string;
    documents: string[];
    folders: string[];
  }>;
};

const APP_FEATURES = [
  "Home — AI search for documents and workspace help",
  "Documents — study notes and folders",
  "Appointments — schedule and deadlines",
  "News — announcements and feed",
];

export function buildAiWorkspaceContext(
  nodes: DocumentNodeRecord[]
): AiWorkspaceContext {
  const catalog = buildDocumentSearchCatalog(nodes);

  return {
    app: "Shi studygram",
    features: APP_FEATURES,
    search: {
      matches: [
        "document title",
        "document description",
        "section and folder path",
        "text inside document pages",
      ],
      tip: "Users can type any topic, phrase, or keyword from inside a document — not only the document name.",
    },
    pages: catalog.map((entry) => ({
      title: entry.title,
      section: entry.sectionTitle,
      location: entry.locationContext,
      description: entry.description,
    })),
    sections: buildSectionSearchContext(nodes),
  };
}

export function formatAiWorkspaceContext(context: AiWorkspaceContext) {
  return JSON.stringify(context);
}
