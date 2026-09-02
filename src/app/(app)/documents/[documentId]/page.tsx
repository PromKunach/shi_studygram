"use client";

import { Suspense, use } from "react";
import { useSearchParams } from "next/navigation";
import { DocumentPageView } from "@/components/documents/document-page-view";

type DocumentPageProps = {
  params: Promise<{ documentId: string }>;
};

function DocumentPageContent({ documentId }: { documentId: string }) {
  const searchParams = useSearchParams();
  const embed = searchParams.get("embed") === "1";

  return <DocumentPageView documentId={documentId} embed={embed} />;
}

export default function DocumentPage({ params }: DocumentPageProps) {
  const { documentId } = use(params);

  return (
    <Suspense fallback={<DocumentPageView documentId={documentId} embed={false} />}>
      <DocumentPageContent documentId={documentId} />
    </Suspense>
  );
}
