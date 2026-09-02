import { describe, expect, it } from "vitest";
import {
  createDocumentBlock,
  createDocumentBoardBlock,
  createGoogleDriveInline,
  createLinkInline,
  filterSlashCommands,
  isBoardBlock,
  isBulletBlock,
  normalizeDocumentInline,
  parseDocumentContent,
  serializeDocumentContent,
  splitBlockAtOffset,
  wrapInlineMarker,
} from "./document-blocks";

describe("document slash commands", () => {
  it("includes Link and Bullets in the slash menu", () => {
    const ids = filterSlashCommands("").map((command) => command.id);
    expect(ids).toContain("link");
    expect(ids).toContain("bullet");
  });

  it("finds Link by keyword", () => {
    expect(filterSlashCommands("url").map((command) => command.id)).toContain(
      "link"
    );
  });

  it("finds Board by keyword", () => {
    expect(filterSlashCommands("board").map((command) => command.id)).toContain(
      "board"
    );
  });
});

describe("document inlines", () => {
  it("normalizes a link inline", () => {
    const inline = createLinkInline("https://example.com", "Example");
    const normalized = normalizeDocumentInline(inline);
    expect(normalized).toEqual(inline);
  });

  it("rejects an inline without a type", () => {
    expect(
      normalizeDocumentInline({
        id: "1",
        url: "https://example.com",
        name: "Example",
      })
    ).toBeNull();
  });
});

describe("board blocks", () => {
  it("round-trips a board block through serialize/parse", () => {
    const block = createDocumentBoardBlock("announce-1", "Team board");
    expect(isBoardBlock(block.type)).toBe(true);

    const parsed = parseDocumentContent(serializeDocumentContent([block]));

    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.type).toBe("board");
    expect(parsed[0]?.boardId).toBe("announce-1");
    expect(parsed[0]?.boardName).toBe("Team board");
  });
});

describe("bullet blocks", () => {
  it("round-trips a bullet block through serialize/parse", () => {
    const block = createDocumentBlock("bullet", "Milk");
    expect(isBulletBlock(block.type)).toBe(true);

    const parsed = parseDocumentContent(
      serializeDocumentContent([block])
    );

    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.type).toBe("bullet");
    expect(parsed[0]?.text).toBe("Milk");
  });
});

describe("splitBlockAtOffset", () => {
  it("splits plain text in the middle", () => {
    const block = createDocumentBlock("paragraph", "hello");
    const { before, after } = splitBlockAtOffset(block, 2);

    expect(before.text).toBe("he");
    expect(after.text).toBe("llo");
  });

  it("keeps inline chips after the cursor", () => {
    const inline = createLinkInline("https://example.com", "Example");
    const block = createDocumentBlock("paragraph", `hi${wrapInlineMarker(inline.id)}`, [
      inline,
    ]);
    const { before, after } = splitBlockAtOffset(block, 2);

    expect(before.text).toBe("hi");
    expect(before.inlines).toEqual([]);
    expect(after.text).toBe(wrapInlineMarker(inline.id));
    expect(after.inlines).toEqual([inline]);
  });
});
