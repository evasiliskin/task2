import { normalizeSearchQuery } from './normalize-search-query';

export function toCanonicalQuery(rawQuery: string): string {
  return normalizeSearchQuery(rawQuery).toLowerCase();
}
