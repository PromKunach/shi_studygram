import { describe, expect, it } from "vitest";

import { aiGenerateRequestSchema } from "@/lib/ai/validation";

describe("aiGenerateRequestSchema", () => {
  it("accepts a valid prompt", () => {
    const result = aiGenerateRequestSchema.safeParse({
      prompt: "สรุปวิชาคณิตศาสตร์",
    });

    expect(result.success).toBe(true);
  });

  it("rejects empty prompts", () => {
    const result = aiGenerateRequestSchema.safeParse({
      prompt: "   ",
    });

    expect(result.success).toBe(false);
  });

  it("defaults stream to false", () => {
    const result = aiGenerateRequestSchema.parse({
      prompt: "hello",
    });

    expect(result.stream).toBe(false);
  });
});
