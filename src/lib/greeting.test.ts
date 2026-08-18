import { describe, it, expect } from "vitest";
import { getGreeting } from "./greeting";

describe("getGreeting", () => {
  it("returns Good morning before noon", () => {
    expect(getGreeting(new Date("2026-01-01T08:00:00"))).toBe("Good morning");
  });

  it("returns Good afternoon between noon and 6pm", () => {
    expect(getGreeting(new Date("2026-01-01T14:00:00"))).toBe("Good afternoon");
  });

  it("returns Good evening after 6pm", () => {
    expect(getGreeting(new Date("2026-01-01T20:00:00"))).toBe("Good evening");
  });

  it("returns Good morning at exactly midnight", () => {
    expect(getGreeting(new Date("2026-01-01T00:00:00"))).toBe("Good morning");
  });
});
