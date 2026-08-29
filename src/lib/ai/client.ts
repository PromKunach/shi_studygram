import type { AiAnswerResponse } from "@/lib/ai/types";

type RequestAiAnswerOptions = {
  prompt: string;
  signal?: AbortSignal;
  onTextChunk?: (chunk: string) => void;
};

async function readErrorMessage(response: Response) {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error ?? `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}

export async function requestAiAnswer({
  prompt,
  signal,
  onTextChunk,
}: RequestAiAnswerOptions): Promise<AiAnswerResponse> {
  const response = await fetch("/api/ai/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, stream: true }),
    signal,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await response.json()) as AiAnswerResponse;
  }

  if (!response.body) {
    throw new Error("No response stream received");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    text += chunk;
    onTextChunk?.(text);
  }

  return { type: "text", text };
}

type GenerateAiTextOptions = {
  prompt: string;
  signal?: AbortSignal;
};

type GenerateAiTextResult = {
  text: string;
};

export async function generateAiText({
  prompt,
  signal,
}: GenerateAiTextOptions): Promise<GenerateAiTextResult> {
  const response = await fetch("/api/ai/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, stream: false }),
    signal,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const data = (await response.json()) as
    | GenerateAiTextResult
    | { type: "text"; text: string }
    | { type: "search"; message: string; results: unknown[] };

  if ("type" in data && data.type === "text") {
    return { text: data.text };
  }

  if ("type" in data && data.type === "search") {
    return { text: data.message };
  }

  return data as GenerateAiTextResult;
}

export async function streamAiText({
  prompt,
  signal,
  onChunk,
}: GenerateAiTextOptions & {
  onChunk: (chunk: string) => void;
}): Promise<string> {
  const result = await requestAiAnswer({ prompt, signal, onTextChunk: onChunk });
  if (result.type === "search") {
    return result.message;
  }

  return result.text;
}
