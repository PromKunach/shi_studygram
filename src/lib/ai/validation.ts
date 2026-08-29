import { z } from "zod";

import { AI_PROMPT_MAX_LENGTH } from "@/lib/ai/config";

export const aiGenerateRequestSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(1, "Prompt is required")
    .max(AI_PROMPT_MAX_LENGTH, "Prompt is too long"),
  stream: z.boolean().optional().default(false),
});

export type AiGenerateRequest = z.infer<typeof aiGenerateRequestSchema>;
