import { TestBed } from '@angular/core/testing';
import { CLOCK } from '@core/time/clock.token';
import { MappedSearchPage } from './search-result.mapper';
import { appConfig } from '@core/config/app-config';
import { SearchResultsCache } from './search-results-cache.service';

const { ttlMs, maxEntries } = appConfig.search.cache;

describe('SearchResultsCache', () => {
  let now: number;

  function aPage(): MappedSearchPage {
    return { results: [], totalCount: 0, pageCount: 0 };
  }

  function createCache(): SearchResultsCache {
    now = 0;
    TestBed.configureTestingModule({ providers: [{ provide: CLOCK, useValue: () => now }] });

    return TestBed.inject(SearchResultsCache);
  }

  it('should return undefined, when the query and page were never cached', () => {
    const cache = createCache();

    expect(cache.get('cats', 1)).toBeUndefined();
  });

  it('should return the cached page, when the same query and page are requested', () => {
    const cache = createCache();
    const page = aPage();

    cache.set('cats', 1, page);

    expect(cache.get('cats', 1)).toBe(page);
  });

  it('should return the cached page, when the query differs only in casing', () => {
    const cache = createCache();
    const page = aPage();

    cache.set('Cats', 1, page);

    expect(cache.get('cats', 1)).toBe(page);
  });

  it('should return undefined, when a different query is requested', () => {
    const cache = createCache();

    cache.set('cats', 1, aPage());

    expect(cache.get('dogs', 1)).toBeUndefined();
  });

  it('should keep the entries apart, when queries differ beyond casing and whitespace', () => {
    const cache = createCache();
    const spaced = aPage();
    const hyphenated = aPage();

    cache.set('cat dog', 1, spaced);
    cache.set('cat-dog', 1, hyphenated);

    expect(cache.get('cat dog', 1)).toBe(spaced);
    expect(cache.get('cat-dog', 1)).toBe(hyphenated);
  });

  it('should keep the entries apart, when different pages of one query are cached', () => {
    const cache = createCache();
    const firstPage = aPage();
    const secondPage = aPage();

    cache.set('cats', 1, firstPage);
    cache.set('cats', 2, secondPage);

    expect(cache.get('cats', 1)).toBe(firstPage);
    expect(cache.get('cats', 2)).toBe(secondPage);
  });

  it('should evict the least recently read entry, when the cache exceeds its capacity', () => {
    const cache = createCache();
    for (let index = 0; index < maxEntries; index++) {
      cache.set(`query ${index}`, 1, aPage());
    }

    cache.get('query 0', 1);
    cache.set('overflowing query', 1, aPage());

    expect(cache.get('query 0', 1)).toBeDefined();
    expect(cache.get('query 1', 1)).toBeUndefined();
    expect(cache.get('overflowing query', 1)).toBeDefined();
  });

  it('should return the cached page, when it is read just inside the TTL', () => {
    const cache = createCache();
    const page = aPage();
    cache.set('cats', 1, page);

    now = ttlMs - 1;

    expect(cache.get('cats', 1)).toBe(page);
  });

  it('should return undefined, when the entry is older than the TTL', () => {
    const cache = createCache();
    cache.set('cats', 1, aPage());

    now = ttlMs;

    expect(cache.get('cats', 1)).toBeUndefined();
  });
});
