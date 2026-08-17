import { Injectable, inject } from '@angular/core';
import { APP_CONFIG } from '@core/config/app-config.token';
import { CLOCK } from '@core/time/clock.token';
import { toCanonicalQuery } from '@shared/search-query';
import { MappedSearchPage } from './search-result.mapper';

interface CacheEntry {
  readonly value: MappedSearchPage;
  readonly storedAt: number;
}

@Injectable({ providedIn: 'root' })
export class SearchResultsCache {
  private readonly now = inject(CLOCK);
  private readonly config = inject(APP_CONFIG).search.cache;
  private readonly entries = new Map<string, CacheEntry>();

  get(query: string, page: number): MappedSearchPage | undefined {
    const key = this.cacheKey(query, page);
    const entry = this.entries.get(key);
    if (!entry) {
      return undefined;
    }
    if (this.now() - entry.storedAt >= this.config.ttlMs) {
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
    this.entries.set(key, { value, storedAt: this.now() });

    while (this.entries.size > this.config.maxEntries) {
      const leastRecentlyUsedKey = this.entries.keys().next().value;
      if (leastRecentlyUsedKey === undefined) {
        return;
      }
      this.entries.delete(leastRecentlyUsedKey);
    }
  }

  private cacheKey(query: string, page: number): string {
    return `${encodeURIComponent(toCanonicalQuery(query))}::${page}`;
  }
}
