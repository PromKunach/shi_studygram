export type DocumentColorId =
  | "none"
  | "blue"
  | "violet"
  | "emerald"
  | "amber"
  | "rose"
  | "cyan";

export type DocumentColorOption = {
  id: DocumentColorId;
  label: string;
  from?: string;
  to?: string;
};

/** Saturated gradient pairs for swatches and card accents. */
export const DOCUMENT_COLOR_OPTIONS: DocumentColorOption[] = [
  { id: "none", label: "No color" },
  { id: "blue", label: "น้ำเงิน", from: "#2383e2", to: "#529cca" },
  { id: "violet", label: "ม่วง", from: "#7c3aed", to: "#a78bfa" },
  { id: "emerald", label: "เขียว", from: "#059669", to: "#34d399" },
  { id: "amber", label: "ส้ม", from: "#d97706", to: "#fbbf24" },
  { id: "rose", label: "ชมพู", from: "#e11d48", to: "#fb7185" },
  { id: "cyan", label: "ฟ้า", from: "#0891b2", to: "#22d3ee" },
];

export const DEFAULT_DOCUMENT_COLOR: DocumentColorId = "blue";

export function getDocumentColorOption(
  id: DocumentColorId | undefined
): DocumentColorOption {
  return (
    DOCUMENT_COLOR_OPTIONS.find((option) => option.id === id) ??
    DOCUMENT_COLOR_OPTIONS.find((option) => option.id === "blue")!
  );
}

export function getDocumentColorStyles(id: DocumentColorId | undefined) {
  const option = getDocumentColorOption(id);

  if (option.id === "none" || !option.from || !option.to) {
    return {
      hasColor: false,
      accent: "var(--muted)",
      swatch: "",
      cardFill: "transparent",
      tabFill: "var(--sidebar)",
    };
  }

  const { from, to } = option;

  return {
    hasColor: true,
    accent: from,
    swatch: `linear-gradient(145deg, ${from}, ${to})`,
    cardFill: `linear-gradient(to bottom, color-mix(in srgb, ${from} 24%, transparent), transparent)`,
    tabFill: `linear-gradient(180deg, color-mix(in srgb, ${from} 20%, var(--sidebar)), var(--sidebar))`,
  };
}
