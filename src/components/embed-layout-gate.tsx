"use client";

import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";

type EmbedLayoutGateProps = {
  children: React.ReactNode;
};

export function EmbedLayoutGate({ children }: EmbedLayoutGateProps) {
  const searchParams = useSearchParams();
  const isEmbed = searchParams.get("embed") === "1";

  if (isEmbed) {
    return (
      <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-background">
        {children}
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
