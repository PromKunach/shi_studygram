export type AiDocumentMatch = {
  id: string;
  title: string;
  href: string;
  kind: "page" | "folder";
  sectionTitle?: string;
};

export type AiSearchResponse = {
  type: "search";
  message: string;
  results: AiDocumentMatch[];
};

export type AiTextResponse = {
  type: "text";
  text: string;
};

export type AiAnswerResponse = AiSearchResponse | AiTextResponse;
