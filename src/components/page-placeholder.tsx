import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PAGE_MAIN } from "@/lib/layout";

type PagePlaceholderProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
};

export function PagePlaceholder({
  icon,
  title,
  description,
}: PagePlaceholderProps) {
  return (
    <main className={PAGE_MAIN}>
      <PageHeader icon={icon} title={title} description={description} />
    </main>
  );
}
