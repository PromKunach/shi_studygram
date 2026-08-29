import { describe, expect, it } from "vitest";

import {
  splitBoldMarkdown,
  splitMarkdownBlocks,
} from "@/components/ai-formatted-text";

describe("splitBoldMarkdown", () => {
  it("splits bold markdown segments", () => {
    expect(splitBoldMarkdown("มี **คณิตศาสตร์** และ **วิทยาศาสตร์**")).toEqual([
      { type: "text", value: "มี " },
      { type: "bold", value: "คณิตศาสตร์" },
      { type: "text", value: " และ " },
      { type: "bold", value: "วิทยาศาสตร์" },
    ]);
  });

  it("returns plain text when no bold markers exist", () => {
    expect(splitBoldMarkdown("hello world")).toEqual([
      { type: "text", value: "hello world" },
    ]);
  });
});

describe("splitMarkdownBlocks", () => {
  it("splits asterisk lines into bullet lists", () => {
    expect(
      splitMarkdownBlocks("มีเอกสารดังนี้:\n* คณิตศาสตร์\n* วิทยาศาสตร์")
    ).toEqual([
      { type: "paragraph", value: "มีเอกสารดังนี้:" },
      { type: "list", items: ["คณิตศาสตร์", "วิทยาศาสตร์"] },
    ]);
  });

  it("keeps bold markers inside bullet items", () => {
    expect(splitMarkdownBlocks("* **คณิตศาสตร์** — แบบฝึกหัด")).toEqual([
      { type: "list", items: ["**คณิตศาสตร์** — แบบฝึกหัด"] },
    ]);
  });
});
