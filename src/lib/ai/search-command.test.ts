import { describe, expect, it } from "vitest";

import {
  isSearchCommand,
  parseSearchCommand,
  SEARCH_COMMAND_PREFIX,
} from "@/lib/ai/search-command";

describe("search command", () => {
  it("detects the /ค้นหา prefix", () => {
    expect(isSearchCommand(`${SEARCH_COMMAND_PREFIX} ชีวะ`)).toBe(true);
    expect(isSearchCommand("ช่วยสรุปบทเรียน")).toBe(false);
  });

  it("extracts the query after /ค้นหา", () => {
    expect(parseSearchCommand(`${SEARCH_COMMAND_PREFIX} เอกสารชีวะ`)).toBe(
      "เอกสารชีวะ"
    );
    expect(parseSearchCommand("  /ค้นหา   เคมี  ")).toBe("เคมี");
    expect(parseSearchCommand("ถามทั่วไป")).toBeNull();
  });

  it("returns an empty string when only the command is provided", () => {
    expect(parseSearchCommand(SEARCH_COMMAND_PREFIX)).toBe("");
  });
});
