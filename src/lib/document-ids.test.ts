import { describe, expect, it } from "vitest";
import { isDocumentNodeId, parseDocumentNodeHref } from "./document-ids";

describe("document ids", () => {
  it("accepts valid uuid document ids", () => {
    expect(
      isDocumentNodeId("96677946-c456-4949-9057-0d52d72108fa")
    ).toBe(true);
  });

  it("rejects student id style slugs", () => {
    expect(isDocumentNodeId("69302311014")).toBe(false);
  });

  it("parses document hrefs with uuid ids only", () => {
    expect(
      parseDocumentNodeHref("/documents/96677946-c456-4949-9057-0d52d72108fa")
    ).toBe("96677946-c456-4949-9057-0d52d72108fa");
    expect(parseDocumentNodeHref("/documents/69302311014")).toBeNull();
    expect(parseDocumentNodeHref("/documents")).toBeNull();
  });
});
