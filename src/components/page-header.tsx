import type { LucideIcon } from "lucide-react";

type PageHeaderProps = {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  description?: string;
};

export function PageHeader({
  icon: Icon,
  title,
  subtitle,
  description,
}: PageHeaderProps) {
  return (
    <header>
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-hover text-foreground">
        <Icon className="h-7 w-7" strokeWidth={1.75} />
      </div>
      <h1 className="text-3xl font-semibold leading-[1.2] tracking-tight text-foreground sm:text-4xl md:text-[40px]">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-2 text-lg text-muted">{subtitle}</p>
      )}
      {description && (
        <p className="mt-4 max-w-xl text-base text-muted">{description}</p>
      )}
    </header>
  );
}
