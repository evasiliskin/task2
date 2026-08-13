export const MIN_MEANINGFUL_QUERY_LENGTH = 2;

export function isMeaningfulQuery(normalizedQuery: string): boolean {
  return normalizedQuery.length >= MIN_MEANINGFUL_QUERY_LENGTH;
}
