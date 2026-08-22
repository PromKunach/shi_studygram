import Link from "next/link";
import { DocumentCardCaptionMenu } from "@/components/documents/document-card-caption-menu";
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
import {
  DOCUMENT_CARD_CAPTION_GAP,
  DOCUMENT_CARD_HEIGHT,
  DOCUMENT_CARD_PADDING,
  DOCUMENT_CARD_RADIUS,
  DOCUMENT_CARD_WIDTH,
  DOCUMENT_COLOR_FADE_HEIGHT,
  DOCUMENT_ICON_CLASS,
  FOLDER_BODY_OFFSET,
  FOLDER_BODY_RADIUS,
  FOLDER_CARD_WIDTH,
  FOLDER_TAB_HEIGHT,
  FOLDER_TAB_RADIUS,
} from "@/components/documents/document-card-metrics";

export type DocumentItem = {
  id: string;
  title: string;
  type: DocumentContentType;
  icon: DocumentIconId;
  color: DocumentColorId;
  updatedAt?: string;
  driveUrl?: string;
};

type DocumentCardProps = {
  document: DocumentItem;
  href?: string;
  onOpen?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isBusy?: boolean;
  highlighted?: boolean;
  className?: string;
};

function iconColorProps(
  highlighted: boolean,
  colorStyles: ReturnType<typeof getDocumentColorStyles>
) {
  return highlighted && colorStyles.hasColor
    ? {
        style: { color: colorStyles.accent } as const,
        className: DOCUMENT_ICON_CLASS,
      }
    : {
        style: undefined,
        className: cn(DOCUMENT_ICON_CLASS, "text-muted"),
      };
}

function CardCaption({
  title,
  updatedAt,
  className,
}: {
  title: string;
  updatedAt?: string;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", DOCUMENT_CARD_CAPTION_GAP, className)}>
      <p className="line-clamp-2 text-left text-xs font-medium leading-snug text-foreground sm:text-sm">
        {title}
      </p>
      {updatedAt && (
        <p className="mt-0.5 text-[10px] text-muted sm:text-xs">{updatedAt}</p>
      )}
    </div>
  );
}

function CardCaptionRow({
  document,
  widthClass,
  onEdit,
  onDelete,
  isBusy,
}: {
  document: DocumentItem;
  widthClass: string;
  onEdit?: () => void;
  onDelete?: () => void;
  isBusy?: boolean;
}) {
  if (onEdit && onDelete) {
    return (
      <DocumentCardCaptionMenu
        title={document.title}
        updatedAt={document.updatedAt}
        typeLabel={document.type === "folder" ? "folder" : "document"}
        className={widthClass}
        onEdit={onEdit}
        onDelete={onDelete}
        isBusy={isBusy}
      />
    );
  }

  return (
    <CardCaption
      title={document.title}
      updatedAt={document.updatedAt}
      className={widthClass}
    />
  );
}

function CardIconContent({
  Icon,
  highlighted,
  colorStyles,
}: {
  Icon: ReturnType<typeof getDocumentIcon>;
  highlighted: boolean;
  colorStyles: ReturnType<typeof getDocumentColorStyles>;
}) {
  return (
    <div className="relative mt-auto">
      <Icon {...iconColorProps(highlighted, colorStyles)} strokeWidth={1.75} />
    </div>
  );
}

function DocumentPageCardSurface({
  highlighted,
  className,
  Icon,
  colorStyles,
  children,
}: {
  highlighted: boolean;
  className?: string;
  Icon: ReturnType<typeof getDocumentIcon>;
  colorStyles: ReturnType<typeof getDocumentColorStyles>;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "group/card relative flex aspect-[4/5] flex-col overflow-hidden border border-border bg-sidebar transition-colors hover:bg-hover",
        DOCUMENT_CARD_PADDING,
        DOCUMENT_CARD_RADIUS,
        DOCUMENT_CARD_WIDTH,
        className
      )}
    >
      {colorStyles.hasColor && (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0",
            DOCUMENT_COLOR_FADE_HEIGHT
          )}
          style={{ background: colorStyles.cardFill }}
        />
      )}

      {children ?? (
        <CardIconContent
          Icon={Icon}
          highlighted={highlighted}
          colorStyles={colorStyles}
        />
      )}
    </div>
  );
}

function FolderCardSurface({
  highlighted,
  className,
  Icon,
  colorStyles,
}: {
  highlighted: boolean;
  className?: string;
  Icon: ReturnType<typeof getDocumentIcon>;
  colorStyles: ReturnType<typeof getDocumentColorStyles>;
}) {
  return (
    <div className={cn("relative block shrink-0", FOLDER_CARD_WIDTH, DOCUMENT_CARD_HEIGHT, className)}>
      <div
        aria-hidden
        className={cn(
          "absolute left-0 top-0 z-0 w-[42%] border border-border border-b-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
          FOLDER_TAB_HEIGHT,
          FOLDER_TAB_RADIUS,
          !colorStyles.hasColor && "bg-sidebar"
        )}
        style={colorStyles.hasColor ? { background: colorStyles.tabFill } : undefined}
      />

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 z-10 flex flex-col overflow-hidden border border-border bg-sidebar transition-colors group-hover/card:bg-hover",
          FOLDER_BODY_OFFSET,
          DOCUMENT_CARD_PADDING,
          DOCUMENT_CARD_RADIUS,
          FOLDER_BODY_RADIUS
        )}
      >
        {colorStyles.hasColor && (
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-x-0 top-0",
              DOCUMENT_CARD_RADIUS,
              FOLDER_BODY_RADIUS,
              DOCUMENT_COLOR_FADE_HEIGHT
            )}
            style={{ background: colorStyles.cardFill }}
          />
        )}

        <CardIconContent
          Icon={Icon}
          highlighted={highlighted}
          colorStyles={colorStyles}
        />
      </div>
    </div>
  );
}

function DocumentCardFrame({
  document,
  href,
  onOpen,
  onEdit,
  onDelete,
  isBusy,
  highlighted,
  className,
  Icon,
  colorStyles,
  isFolder,
}: DocumentCardProps & {
  Icon: ReturnType<typeof getDocumentIcon>;
  colorStyles: ReturnType<typeof getDocumentColorStyles>;
  isFolder: boolean;
}) {
  const widthClass = isFolder ? FOLDER_CARD_WIDTH : DOCUMENT_CARD_WIDTH;

  const surface = isFolder ? (
    <FolderCardSurface
      highlighted={!!highlighted}
      Icon={Icon}
      colorStyles={colorStyles}
    />
  ) : (
    <DocumentPageCardSurface
      highlighted={!!highlighted}
      Icon={Icon}
      colorStyles={colorStyles}
    />
  );

  const caption = (
    <CardCaptionRow
      document={document}
      widthClass={widthClass}
      onEdit={onEdit}
      onDelete={onDelete}
      isBusy={isBusy}
    />
  );

  const wrapperClassName = cn(
    "group flex shrink-0 flex-col text-left",
    widthClass,
    className
  );

  const surfaceClassName = cn(
    "block w-full text-left",
    onOpen && "cursor-pointer"
  );

  if (onOpen) {
    return (
      <div className={wrapperClassName}>
        <button type="button" onClick={onOpen} className={surfaceClassName}>
          {surface}
        </button>
        {caption}
      </div>
    );
  }

  if (href) {
    return (
      <div className={wrapperClassName}>
        <Link href={href} className={surfaceClassName}>
          {surface}
        </Link>
        {caption}
      </div>
    );
  }

  return (
    <div className={wrapperClassName}>
      <div className={surfaceClassName}>{surface}</div>
      {caption}
    </div>
  );
}

export function DocumentCard({
  document,
  href,
  onOpen,
  onEdit,
  onDelete,
  isBusy,
  highlighted = false,
  className,
}: DocumentCardProps) {
  const Icon = getDocumentIcon(document.icon);
  const colorStyles = getDocumentColorStyles(document.color);
  const isFolder = document.type === "folder";

  return (
    <DocumentCardFrame
      document={document}
      href={href}
      onOpen={onOpen}
      onEdit={onEdit}
      onDelete={onDelete}
      isBusy={isBusy}
      highlighted={highlighted}
      className={className}
      Icon={Icon}
      colorStyles={colorStyles}
      isFolder={isFolder}
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

  const Icon = getDocumentIcon(previewDocument.icon);
  const colorStyles = getDocumentColorStyles(previewDocument.color);
  const isFolder = previewDocument.type === "folder";

  return (
    <div className="flex justify-center overflow-hidden py-1">
      <div className="-mb-[2.1rem] origin-top scale-[0.72] sm:-mb-[2rem] sm:scale-[0.78]">
        <div
          className={cn(
            "flex flex-col",
            isFolder ? FOLDER_CARD_WIDTH : DOCUMENT_CARD_WIDTH
          )}
        >
          {isFolder ? (
            <FolderCardSurface highlighted Icon={Icon} colorStyles={colorStyles} />
          ) : (
            <DocumentPageCardSurface highlighted Icon={Icon} colorStyles={colorStyles} />
          )}
          <CardCaption title={previewDocument.title} />
        </div>
      </div>
    </div>
  );
}
