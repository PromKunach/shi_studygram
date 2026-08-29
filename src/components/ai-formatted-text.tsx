import { cn } from "@/lib/utils";

type TextSegment =
  | { type: "text"; value: string }
  | { type: "bold"; value: string };

export type MarkdownBlock =
  | { type: "paragraph"; value: string }
  | { type: "list"; items: string[] };

function isBulletLine(line: string) {
  return /^\*\s+/.test(line);
}

function stripBulletPrefix(line: string) {
  return line.replace(/^\*\s+/, "");
}

export function splitMarkdownBlocks(text: string): MarkdownBlock[] {
  const lines = text.split("\n");
  const blocks: MarkdownBlock[] = [];
  let paragraphLines: string[] = [];
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return;

    const value = paragraphLines.join("\n").trimEnd();
    if (value.trim()) {
      blocks.push({ type: "paragraph", value });
    }

    paragraphLines = [];
  };

  const flushList = () => {
    if (listItems.length === 0) return;

    blocks.push({ type: "list", items: [...listItems] });
    listItems = [];
  };

  for (const line of lines) {
    if (isBulletLine(line)) {
      flushParagraph();
      listItems.push(stripBulletPrefix(line));
      continue;
    }

    flushList();
    paragraphLines.push(line);
  }

  flushList();
  flushParagraph();

  return blocks;
}

export function splitBoldMarkdown(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  const pattern = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;

  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;

    if (index > lastIndex) {
      segments.push({ type: "text", value: text.slice(lastIndex, index) });
    }

    segments.push({ type: "bold", value: match[1] ?? "" });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) });
  }

  return segments;
}

type AiFormattedTextProps = {
  text: string;
  className?: string;
};

export function AiFormattedText({ text, className }: AiFormattedTextProps) {
  const segments = splitBoldMarkdown(text);

  if (segments.length === 0) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {segments.map((segment, index) =>
        segment.type === "bold" ? (
          <strong key={index} className="font-semibold text-foreground">
            {segment.value}
          </strong>
        ) : (
          <span key={index}>{segment.value}</span>
        )
      )}
    </span>
  );
}

export function AiFormattedContent({ text, className }: AiFormattedTextProps) {
  const blocks = splitMarkdownBlocks(text);

  if (blocks.length === 0) {
    return null;
  }

  if (blocks.length === 1 && blocks[0]?.type === "paragraph") {
    return (
      <p
        className={cn(
          "whitespace-pre-wrap text-sm leading-relaxed text-foreground",
          className
        )}
      >
        <AiFormattedText text={blocks[0].value} />
      </p>
    );
  }

  return (
    <div
      className={cn(
        "space-y-2 text-sm leading-relaxed text-foreground",
        className
      )}
    >
      {blocks.map((block, index) =>
        block.type === "list" ? (
          <ul key={index} className="list-disc space-y-1 pl-5 marker:text-muted">
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex}>
                <AiFormattedText text={item} />
              </li>
            ))}
          </ul>
        ) : (
          <p key={index} className="whitespace-pre-wrap">
            <AiFormattedText text={block.value} />
          </p>
        )
      )}
    </div>
  );
}

export function AiFormattedParagraph({
  text,
  className,
}: AiFormattedTextProps) {
  return <AiFormattedContent text={text} className={className} />;
}
