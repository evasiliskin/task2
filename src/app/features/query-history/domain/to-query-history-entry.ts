import { toCanonicalQuery } from '@shared/search-query';
import { QueryHistoryEntry } from './query-history-entry.model';

export function toQueryHistoryEntry(query: string, usedAt: number): QueryHistoryEntry {
  const canonicalQuery = toCanonicalQuery(query);
  return {
    query,
    canonicalQuery,
    words: canonicalQuery.split(' ').filter((word) => word.length > 0),
    lastUsedAt: usedAt,
  };
}
