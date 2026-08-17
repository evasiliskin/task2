export const MIN_MEANINGFUL_QUERY_LENGTH = 2;

export function isMeaningfulQuery(normalizedQuery: string): boolean {
  if (normalizedQuery.length >= MIN_MEANINGFUL_QUERY_LENGTH) {
    return true;
  }
  const codePoint = normalizedQuery.codePointAt(0);
  return codePoint !== undefined && codePoint > 0x7f;
}
