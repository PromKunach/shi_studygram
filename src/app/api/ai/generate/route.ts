import { generateText, streamText } from "ai";

import {
  getAiChatSystemPrompt,
  getAiConfigurationError,
  getAiModel,
  isAiConfigured,
} from "@/lib/ai/config";
import { searchDocumentsWithAi } from "@/lib/ai/document-search";
import { resolveAiIntent } from "@/lib/ai/intent";
import { buildAiWorkspaceContext } from "@/lib/ai/workspace-context";
import { aiGenerateRequestSchema } from "@/lib/ai/validation";
import { fetchAllDocumentNodes } from "@/lib/documents";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isAiConfigured()) {
    return Response.json({ error: getAiConfigurationError() }, { status: 503 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = aiGenerateRequestSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  const { prompt, stream } = parsed.data;
  const nodes = await fetchAllDocumentNodes();
  const intent = resolveAiIntent(prompt, nodes);

  if (intent.mode === "search") {
    try {
      const searchResult = await searchDocumentsWithAi(
        intent.prompt,
        nodes,
        intent.query
      );

      return Response.json({
        type: "search",
        message: searchResult.message,
        results: searchResult.results,
      });
    } catch (error) {
      console.error("[api/ai/generate] search", error);

      return Response.json(
        { error: "Failed to search documents. Try again shortly." },
        { status: 500 }
      );
    }
  }

  const model = getAiModel();
  const system = getAiChatSystemPrompt(buildAiWorkspaceContext(nodes));

  try {
    if (stream) {
      const result = streamText({
        model,
        system,
        prompt,
      });

      return result.toTextStreamResponse({
        onError: (error) => {
          console.error("[api/ai/generate] stream", error);
          return error instanceof Error
            ? error.message
            : "Failed to generate a response. Try again shortly.";
        },
      });
    }

    const result = await generateText({
      model,
      system,
      prompt,
    });

    return Response.json({ type: "text", text: result.text });
  } catch (error) {
    console.error("[api/ai/generate]", error);

    return Response.json(
      { error: "Failed to generate a response. Try again shortly." },
      { status: 500 }
    );
  }
}
