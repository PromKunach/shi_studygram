const SUBJECT_ALIAS_GROUPS = [
  ["math", "mathematics", "คณิตศาสตร์", "คณิต", "เลข"],
  ["science", "วิทยาศาสตร์", "วิทย์"],
  ["biology", "ชีววิทยา", "ชีวะ", "ชีว"],
  ["chemistry", "เคมี"],
  ["physics", "ฟิสิกส์", "ฟิสิกส์"],
  ["english", "ภาษาอังกฤษ", "อังกฤษ"],
  ["thai", "ภาษาไทย", "ไทย"],
  [
    "social studies",
    "social",
    "สังคมศึกษา",
    "สังคม",
    "history",
    "ประวัติศาสตร์",
    "geography",
    "ภูมิศาสตร์",
  ],
  ["art", "ศิลปะ"],
  ["music", "ดนตรี"],
  ["pe", "พลศึกษา", "physical education"],
  [
    "computer",
    "computing",
    "คอมพิวเตอร์",
    "coding",
    "programming",
    "ไอที",
    "it",
  ],
] as const;

function normalizeAliasText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function aliasMatchesText(alias: string, text: string) {
  return text === alias || text.includes(alias) || alias.includes(text);
}

function getAliasGroupForText(text: string) {
  const normalized = normalizeAliasText(text);

  for (const group of SUBJECT_ALIAS_GROUPS) {
    const normalizedGroup = group.map(normalizeAliasText);

    if (
      normalizedGroup.some((alias) => aliasMatchesText(alias, normalized)) ||
      normalizedGroup.some(
        (alias) => normalized.includes(alias) || alias.includes(normalized)
      )
    ) {
      return normalizedGroup;
    }
  }

  return null;
}

export function expandSearchAliases(text: string) {
  const normalized = normalizeAliasText(text);
  const expanded = new Set<string>([normalized]);
  const group = getAliasGroupForText(normalized);

  if (group) {
    for (const alias of group) {
      expanded.add(alias);
    }
  }

  return [...expanded];
}

export function textsMatchAcrossAliases(left: string, right: string) {
  const leftAliases = expandSearchAliases(left);
  const rightAliases = expandSearchAliases(right);

  for (const leftAlias of leftAliases) {
    for (const rightAlias of rightAliases) {
      if (aliasMatchesText(leftAlias, rightAlias)) {
        return true;
      }
    }
  }

  return false;
}

export function termMatchesHaystackWithAliases(term: string, haystack: string) {
  const normalizedTerm = normalizeAliasText(term);
  const normalizedHaystack = normalizeAliasText(haystack);

  if (normalizedHaystack.includes(normalizedTerm)) return 2;

  for (const alias of expandSearchAliases(normalizedTerm)) {
    if (normalizedHaystack.includes(alias)) return 2;
  }

  const haystackWords = normalizedHaystack.split(/\s+/).filter(Boolean);

  for (const word of haystackWords) {
    if (textsMatchAcrossAliases(normalizedTerm, word)) return 2;
  }

  if (normalizedTerm.length < 3) return 0;

  return haystackWords.some((word) => word.includes(normalizedTerm)) ? 1 : 0;
}

export function queryMatchesTextWithAliases(query: string, text: string) {
  const normalizedQuery = normalizeAliasText(query);
  const normalizedText = normalizeAliasText(text);

  if (!normalizedQuery || !normalizedText) return false;

  if (
    normalizedText.includes(normalizedQuery) ||
    normalizedQuery.includes(normalizedText)
  ) {
    return true;
  }

  if (textsMatchAcrossAliases(normalizedQuery, normalizedText)) {
    return true;
  }

  const queryTerms = normalizedQuery.split(/\s+/).filter(Boolean);
  const textTerms = normalizedText.split(/\s+/).filter(Boolean);

  return queryTerms.some((queryTerm) =>
    textTerms.some((textTerm) => textsMatchAcrossAliases(queryTerm, textTerm))
  );
}
