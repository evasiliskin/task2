import { SearchResultsCache } from './search-results-cache.service';
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
    expect(cache.get('query-0', 1)).toBeDefined();

    cache.set('query-30', 1, { results: [], totalCount: 0, pageCount: 0 });

    expect(cache.get('query-0', 1)).toBeUndefined();
    expect(cache.get('query-30', 1)).toBeDefined();
  });
});
