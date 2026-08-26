const DOCUMENT_NODE_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isDocumentNodeId(value: string) {
  return DOCUMENT_NODE_ID_PATTERN.test(value.trim());
}

export function documentNodeHref(nodeId: string) {
  return `/documents/${nodeId}`;
}

export function parseDocumentNodeHref(href: string): string | null {
  const match = href.trim().match(/^\/documents\/([^/]+)$/);
  if (!match) return null;
  const id = match[1]!;
  return isDocumentNodeId(id) ? id : null;
}
