import Link from "next/link";
import {
  getDocumentColorStyles,
  type DocumentColorId,
} from "@/lib/document-colors";
import {
  getDocumentIcon,
  type DocumentContentType,
  type DocumentIconId,
} from "@/lib/document-icons";
import { cn } from "@/lib/utils";

const DOCUMENT_CARD_WIDTH = "w-36 sm:w-40";
const DOCUMENT_CARD_HEIGHT = "h-[calc(9rem*5/4)] sm:h-[calc(10rem*5/4)]";

export type DocumentItem = {
  id: string;
  title: string;
  type: DocumentContentType;
  icon: DocumentIconId;
  color: DocumentColorId;
  updatedAt?: string;
};

type DocumentCardProps = {
  document: DocumentItem;
  href: string;
  highlighted?: boolean;
  className?: string;
};

function iconColorProps(
  highlighted: boolean,
  colorStyles: ReturnType<typeof getDocumentColorStyles>
) {
  return highlighted && colorStyles.hasColor
    ? { style: { color: colorStyles.accent } as const, className: "h-[18px] w-[18px]" }
    : {
        style: undefined,
        className: "h-[18px] w-[18px] text-muted",
      };
}

function DocumentPageCard({
  document,
  href,
  highlighted,
  className,
  Icon,
  colorStyles,
}: DocumentCardProps & {
  Icon: ReturnType<typeof getDocumentIcon>;
  colorStyles: ReturnType<typeof getDocumentColorStyles>;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex aspect-[4/5] shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-sidebar p-4 transition-colors hover:bg-hover",
        DOCUMENT_CARD_WIDTH,
        className
      )}
    >
      {colorStyles.hasColor && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-20"
          style={{ background: colorStyles.cardFade }}
        />
      )}

      <div className="relative">
        <Icon
          {...iconColorProps(!!highlighted, colorStyles)}
          strokeWidth={1.75}
        />
      </div>

      <div className="relative mt-auto">
        <p className="line-clamp-2 text-left text-sm font-medium leading-snug text-foreground">
          {document.title}
        </p>

        {document.updatedAt && (
          <p className="mt-3 text-xs text-muted">{document.updatedAt}</p>
        )}
      </div>
    </Link>
  );
}

function FolderCard({
  document,
  href,
  highlighted,
  className,
  Icon,
  colorStyles,
}: DocumentCardProps & {
  Icon: ReturnType<typeof getDocumentIcon>;
  colorStyles: ReturnType<typeof getDocumentColorStyles>;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative block w-60 shrink-0 sm:w-64",
        DOCUMENT_CARD_HEIGHT,
        className
      )}
    >
      <div
        aria-hidden
        className="absolute left-0 top-0 z-0 h-6 w-[42%] rounded-t-[14px] border border-border border-b-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
        style={{ background: colorStyles.tabFill }}
      />

      <div className="absolute inset-x-0 bottom-0 top-4 z-10 flex flex-col overflow-hidden rounded-2xl rounded-tl-md border border-border bg-sidebar p-4 transition-colors group-hover:bg-hover">
        {colorStyles.hasColor && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-20 rounded-t-2xl rounded-tl-md"
            style={{ background: colorStyles.cardFade }}
          />
        )}

        <div className="relative">
          <Icon
          {...iconColorProps(!!highlighted, colorStyles)}
          strokeWidth={1.75}
        />
        </div>

        <div className="relative mt-auto min-w-0">
          <p className="line-clamp-2 text-left text-sm font-medium leading-snug text-foreground">
            {document.title}
          </p>
          {document.updatedAt && (
            <p className="mt-3 text-xs text-muted">{document.updatedAt}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

export function DocumentCard({
  document,
  href,
  highlighted = false,
  className,
}: DocumentCardProps) {
  const Icon = getDocumentIcon(document.icon);
  const colorStyles = getDocumentColorStyles(document.color);
  const isFolder = document.type === "folder";

  if (isFolder) {
    return (
      <FolderCard
        document={document}
        href={href}
        highlighted={highlighted}
        className={className}
        Icon={Icon}
        colorStyles={colorStyles}
      />
    );
  }

  return (
    <DocumentPageCard
      document={document}
      href={href}
      highlighted={highlighted}
      className={className}
      Icon={Icon}
      colorStyles={colorStyles}
    />
  );
}

export function DocumentCardPreview({
  type,
  color,
  icon,
  title,
}: {
  type: DocumentContentType;
  color: DocumentColorId;
  icon: DocumentIconId;
  title: string;
}) {
  const previewDocument: DocumentItem = {
    id: "preview",
    title: title || (type === "folder" ? "โฟลเดอร์ใหม่" : "เอกสารใหม่"),
    type,
    icon,
    color,
  };

  return (
    <div className="flex justify-center overflow-hidden py-1">
      <div className="-mb-[3rem] origin-top scale-[0.72] sm:-mb-[2.75rem] sm:scale-[0.78]">
        <DocumentCard document={previewDocument} href="#" highlighted />
      </div>
    </div>
  );
}
