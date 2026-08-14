import { Injectable } from '@angular/core';
import { MappedSearchPage } from './search-result.mapper';

export const MAX_CACHE_ENTRIES = 30;
export const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  readonly value: MappedSearchPage;
  readonly storedAt: number;
}

@Injectable({ providedIn: 'root' })
export class SearchResultsCache {
  private readonly entries = new Map<string, CacheEntry>();

  get(query: string, page: number): MappedSearchPage | undefined {
    const key = this.cacheKey(query, page);
    const entry = this.entries.get(key);
    if (!entry) {
      return undefined;
    }
    if (Date.now() - entry.storedAt >= CACHE_TTL_MS) {
      this.entries.delete(key);
      return undefined;
    }
    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry.value;
  }

  set(query: string, page: number, value: MappedSearchPage): void {
    const key = this.cacheKey(query, page);
    this.entries.delete(key);
    this.entries.set(key, { value, storedAt: Date.now() });

    while (this.entries.size > MAX_CACHE_ENTRIES) {
      const leastRecentlyUsedKey = this.entries.keys().next().value;
      if (leastRecentlyUsedKey === undefined) {
        return;
      }
      this.entries.delete(leastRecentlyUsedKey);
    }
  }

  private cacheKey(query: string, page: number): string {
    return `${query}|${page}`;
  }
}
