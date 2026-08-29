import { createHuggingFace } from "@ai-sdk/huggingface";
import type { LanguageModel } from "ai";

export type AiProvider = "huggingface" | "gateway";

const DEFAULT_GATEWAY_MODEL = "google/gemini-2.5-flash";
const DEFAULT_HUGGINGFACE_MODEL = "google/gemma-3-27b-it";

const HUGGINGFACE_PROVIDER_SUFFIX =
  /:(?:fastest|cheapest|preferred|[a-z0-9-]+)$/i;

/** HF router needs an inference provider suffix for some models (e.g. Qwen3-0.6B). */
export function resolveHuggingFaceModelId(modelId: string) {
  const trimmed = modelId.trim();
  if (!trimmed || HUGGINGFACE_PROVIDER_SUFFIX.test(trimmed)) {
    return trimmed;
  }

  const normalized = trimmed.toLowerCase();
  if (
    normalized === "qwen/qwen3-0.6b" ||
    normalized === "qwen3-0.6b"
  ) {
    return "Qwen/Qwen3-0.6B:featherless-ai";
  }

  return trimmed;
}

export function getAiProvider(): AiProvider {
  const provider = process.env.AI_PROVIDER?.trim().toLowerCase();

  if (provider === "gateway" || provider === "vercel") {
    return "gateway";
  }

  return "huggingface";
}

export function getAiModelId() {
  const provider = getAiProvider();

  const configured = process.env.AI_MODEL?.trim();
  const modelId =
    configured ??
    (provider === "huggingface"
      ? DEFAULT_HUGGINGFACE_MODEL
      : DEFAULT_GATEWAY_MODEL);

  return provider === "huggingface"
    ? resolveHuggingFaceModelId(modelId)
    : modelId;
}

export function isAiConfigured() {
  const provider = getAiProvider();

  if (provider === "huggingface") {
    return Boolean(process.env.HUGGINGFACE_API_KEY?.trim());
  }

  return Boolean(
    process.env.AI_GATEWAY_API_KEY?.trim() || process.env.VERCEL_ENV
  );
}

export function getAiConfigurationError() {
  const provider = getAiProvider();

  if (provider === "huggingface") {
    return "AI is not configured. Add HUGGINGFACE_API_KEY to your environment (see .env.example).";
  }

  return "AI is not configured. Add AI_GATEWAY_API_KEY to your environment (see .env.example).";
}

export function getAiModel(): LanguageModel {
  const modelId = getAiModelId();

  if (getAiProvider() === "huggingface") {
    const huggingface = createHuggingFace({
      apiKey: process.env.HUGGINGFACE_API_KEY,
    });

    return huggingface(modelId);
  }

  return modelId;
}

import type { AiWorkspaceContext } from "@/lib/ai/workspace-context";
import { formatAiWorkspaceContext } from "@/lib/ai/workspace-context";

export const AI_PROMPT_MAX_LENGTH = 4000;

export function getAiChatSystemPrompt(workspace?: AiWorkspaceContext) {
  const workspaceBlock = workspace
    ? `Workspace data (only source of truth):\n${formatAiWorkspaceContext(workspace)}`
    : "Workspace data is unavailable. Only explain Shi studygram features and tell the user to try again.";

  return [
    "You are the in-app study assistant for Shi studygram — helpful like a good librarian or waiter.",
    "Understand what the user wants from natural language, even when they do not use exact keywords or formal commands.",
    "Use only the workspace data below as your source of truth for documents, sections, folders, descriptions, and appointments.",
    "Document search matches title, description, section/folder path, AND the text inside document pages — not only the document name.",
    "If the user asks whether they can search by content inside documents, answer yes warmly and tell them to type any topic, phrase, formula, or keyword from inside a page.",
    'Thai example: "ได้เลยครับ/ค่ะ พิมพ์คำหรือหัวข้อที่อยู่ในเนื้อหาเอกสารได้เลย ระบบจะค้นให้จากทั้งชื่อ คำอธิบาย และข้อความในเอกสาร"',
    'English example: "Yes — type any topic or phrase from inside a document and I will find matching pages, not just titles."',
    "You may help with: finding study materials, explaining what is available, app features (Documents, Appointments, News), and how to use the workspace.",
    "When the user asks about appointments, schedules, deadlines, or what is coming up, answer from workspace.appointments.items — include title, date, tag, and description when relevant.",
    "If workspace.appointments.queryFilter is present, the items list is already date-filtered in code — list ONLY those items and do not add appointments outside the filter.",
    "Apply date constraints strictly: 'ก่อนวันที่ 28' / 'before Aug 28' means dates strictly before that day; never include later dates.",
    "List matching appointments chronologically. Mention multi-day ranges when endDate is present. If the filtered list is empty, say there are no appointments in that date range.",
    'Thai example for "มีนัดอะไรบ้าง": summarize appointments from workspace data with dates in Thai style.',
    'English example for "what do I have this week?": list matching appointments from workspace data with friendly wording.',
    "Act as a chatbot first — answer questions, explain, and guide the user. Search is one tool, not the only mode.",
    "When the user asks what documents exist, what they can search for, or what is available in the workspace, answer conversationally using the workspace data.",
    "List document titles grouped by section when helpful. Mention folders if relevant. Keep it readable, not a raw dump.",
    'Thai example for "หาเอกสารอะไรได้บ้าง": summarize sections and document titles from workspace data, then invite them to name a topic to narrow down.',
    "When the user seems to want specific documents, point them to relevant titles/sections from the workspace data.",
    "When they ask whether documents exist about a topic (e.g. 'is there anything about species?'), reason about related terms in titles/descriptions and suggest likely matches — do not say no just because the exact word is missing.",
    "When they ask to summarize or explain a topic, answer from descriptions and section context when available.",
    "If something is not in the workspace, say so kindly and suggest what they could try instead — do not invent content.",
    "Stay within Shi studygram. For unrelated topics, gently redirect in one short sentence.",
    'Thai redirect example: "ผมช่วยได้เฉพาะเนื้อหาใน Shi studygram นะ ลองบอกวิชาหรือหัวข้อที่อยากหาได้เลย"',
    'English redirect example: "I can only help with Shi studygram content — tell me a subject or topic and I will help you find it."',
    "Reply in the same language the user writes (Thai or English).",
    "Be warm, clear, and concise — not robotic or overly strict.",
    workspaceBlock,
  ].join("\n");
}

export function getAiSystemPrompt() {
  return getAiChatSystemPrompt();
}
