"use client";

import { use } from "react";
import { DocumentPageView } from "@/components/documents/document-page-view";

type DocumentPageProps = {
  params: Promise<{ documentId: string }>;
};

export default function DocumentPage({ params }: DocumentPageProps) {
  const { documentId } = use(params);

  return <DocumentPageView documentId={documentId} />;
}
