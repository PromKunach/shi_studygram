import { Suspense } from "react";
import { EmbedLayoutGate } from "@/components/embed-layout-gate";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-background">{children}</div>
      }
    >
      <EmbedLayoutGate>{children}</EmbedLayoutGate>
    </Suspense>
  );
}
