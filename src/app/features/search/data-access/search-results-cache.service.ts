import { Injectable } from '@angular/core';
import { MappedSearchPage } from './search-result.mapper';

const MAX_CACHE_ENTRIES = 30;

@Injectable({ providedIn: 'root' })
export class SearchResultsCache {
  private readonly entries = new Map<string, MappedSearchPage>();

  get(query: string, page: number): MappedSearchPage | undefined {
    return this.entries.get(this.cacheKey(query, page));
  }

  set(query: string, page: number, value: MappedSearchPage): void {
    const key = this.cacheKey(query, page);
    if (!this.entries.has(key) && this.entries.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = this.entries.keys().next().value;
      if (oldestKey !== undefined) {
        this.entries.delete(oldestKey);
      }
    }
    this.entries.set(key, value);
  }

  private cacheKey(query: string, page: number): string {
    return `${query}|${page}`;
  }
}
