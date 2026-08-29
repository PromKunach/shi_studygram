export const SEARCH_COMMAND_PREFIX = "/ค้นหา";

export function isSearchCommand(prompt: string) {
  return prompt.trim().startsWith(SEARCH_COMMAND_PREFIX);
}

export function parseSearchCommand(prompt: string): string | null {
  const trimmed = prompt.trim();

  if (!trimmed.startsWith(SEARCH_COMMAND_PREFIX)) {
    return null;
  }

  return trimmed.slice(SEARCH_COMMAND_PREFIX.length).trim();
}
