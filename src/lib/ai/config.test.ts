import { afterEach, describe, expect, it } from "vitest";

import {
  getAiConfigurationError,
  getAiModelId,
  getAiProvider,
  isAiConfigured,
} from "@/lib/ai/config";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("ai config", () => {
  it("defaults to huggingface provider", () => {
    delete process.env.AI_PROVIDER;
    expect(getAiProvider()).toBe("huggingface");
  });

  it("defaults to gemma on huggingface", () => {
    delete process.env.AI_PROVIDER;
    delete process.env.AI_MODEL;
    expect(getAiModelId()).toBe("google/gemma-3-27b-it");
  });

  it("adds featherless provider suffix for qwen3-0.6b", () => {
    process.env.AI_PROVIDER = "huggingface";
    process.env.AI_MODEL = "Qwen/Qwen3-0.6B";
    expect(getAiModelId()).toBe("Qwen/Qwen3-0.6B:featherless-ai");
  });

  it("requires huggingface api key when provider is huggingface", () => {
    process.env.AI_PROVIDER = "huggingface";
    delete process.env.HUGGINGFACE_API_KEY;
    expect(isAiConfigured()).toBe(false);
    expect(getAiConfigurationError()).toContain("HUGGINGFACE_API_KEY");
  });

  it("accepts custom huggingface model ids", () => {
    process.env.AI_PROVIDER = "huggingface";
    process.env.AI_MODEL = "google/gemma-2-9b-it";
    expect(getAiModelId()).toBe("google/gemma-2-9b-it");
  });
});
