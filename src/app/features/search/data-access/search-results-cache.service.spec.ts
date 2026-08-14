import { SearchResultsCache, MAX_CACHE_ENTRIES, CACHE_TTL_MS } from './search-results-cache.service';
import { MappedSearchPage } from './search-result.mapper';

describe('SearchResultsCache', () => {
  const page: MappedSearchPage = { results: [], totalCount: 0, pageCount: 0 };

  it('should return undefined, when the query/page was never cached', () => {
    const cache = new SearchResultsCache();
    expect(cache.get('cats', 1)).toBeUndefined();
  });

  it('should return the cached page, when the same query and page are requested', () => {
    const cache = new SearchResultsCache();
    cache.set('cats', 1, page);
    expect(cache.get('cats', 1)).toBe(page);
  });

  it('should treat different pages of the same query as distinct entries, when caching multiple pages', () => {
    const cache = new SearchResultsCache();
    const pageTwo: MappedSearchPage = { results: [], totalCount: 0, pageCount: 0 };
    cache.set('cats', 1, page);
    cache.set('cats', 2, pageTwo);
    expect(cache.get('cats', 1)).toBe(page);
    expect(cache.get('cats', 2)).toBe(pageTwo);
  });

  it('should evict the oldest entry, when the cache exceeds its capacity', () => {
    const cache = new SearchResultsCache();
    for (let i = 0; i < 30; i++) {
      cache.set(`query-${i}`, 1, { results: [], totalCount: 0, pageCount: 0 });
    }

    cache.set('query-30', 1, { results: [], totalCount: 0, pageCount: 0 });

    expect(cache.get('query-0', 1)).toBeUndefined();
    expect(cache.get('query-30', 1)).toBeDefined();
  });

  it('should evict the least recently READ entry, not the least recently written', () => {
    const cache = new SearchResultsCache();
    for (let i = 0; i < MAX_CACHE_ENTRIES; i++) {
      cache.set(`q${i}`, 1, page);
    }

    cache.get('q0', 1);
    cache.set('overflow', 1, page);

    expect(cache.get('q0', 1)).toBeDefined();
    expect(cache.get('q1', 1)).toBeUndefined();
  });

  it('should expire an entry once the TTL has elapsed', () => {
    vi.useFakeTimers();
    const cache = new SearchResultsCache();
    cache.set('cats', 1, page);

    vi.advanceTimersByTime(CACHE_TTL_MS + 1);

    expect(cache.get('cats', 1)).toBeUndefined();
    vi.useRealTimers();
  });

  it('should still serve an entry just inside the TTL', () => {
    vi.useFakeTimers();
    const cache = new SearchResultsCache();
    cache.set('cats', 1, page);

    vi.advanceTimersByTime(CACHE_TTL_MS - 1);

    expect(cache.get('cats', 1)).toBe(page);
    vi.useRealTimers();
  });
});
