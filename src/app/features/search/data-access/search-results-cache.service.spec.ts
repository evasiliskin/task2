import { TestBed } from '@angular/core/testing';
import {
  SearchResultsCache,
  MAX_CACHE_ENTRIES,
  CACHE_TTL_MS,
} from './search-results-cache.service';
import { MappedSearchPage } from './search-result.mapper';
import { CLOCK } from '@core/time/clock.token';

describe('SearchResultsCache', () => {
  const page: MappedSearchPage = { results: [], totalCount: 0, pageCount: 0 };

  it('should return undefined, when the query/page was never cached', () => {
    TestBed.configureTestingModule({});
    const cache = TestBed.inject(SearchResultsCache);
    expect(cache.get('cats', 1)).toBeUndefined();
  });

  it('should return the cached page, when the same query and page are requested', () => {
    TestBed.configureTestingModule({});
    const cache = TestBed.inject(SearchResultsCache);
    cache.set('cats', 1, page);
    expect(cache.get('cats', 1)).toBe(page);
  });

  it('should treat differently-punctuated queries as distinct entries, when they kebab-case identically', () => {
    TestBed.configureTestingModule({});
    const cache = TestBed.inject(SearchResultsCache);
    const catDogSpace: MappedSearchPage = { results: [], totalCount: 0, pageCount: 0 };
    const catDogHyphen: MappedSearchPage = { results: [], totalCount: 0, pageCount: 0 };
    cache.set('cat dog', 1, catDogSpace);
    cache.set('cat-dog', 1, catDogHyphen);
    expect(cache.get('cat dog', 1)).toBe(catDogSpace);
    expect(cache.get('cat-dog', 1)).toBe(catDogHyphen);
  });

  it('should serve the cached page, when the same query is requested with different casing', () => {
    TestBed.configureTestingModule({});
    const cache = TestBed.inject(SearchResultsCache);
    cache.set('Cats', 1, page);
    expect(cache.get('cats', 1)).toBe(page);
  });

  it('should still treat different queries as distinct entries, when they differ beyond casing', () => {
    TestBed.configureTestingModule({});
    const cache = TestBed.inject(SearchResultsCache);
    cache.set('cats', 1, page);
    expect(cache.get('dogs', 1)).toBeUndefined();
  });

  it('should treat different pages of the same query as distinct entries, when caching multiple pages', () => {
    TestBed.configureTestingModule({});
    const cache = TestBed.inject(SearchResultsCache);
    const pageTwo: MappedSearchPage = { results: [], totalCount: 0, pageCount: 0 };
    cache.set('cats', 1, page);
    cache.set('cats', 2, pageTwo);
    expect(cache.get('cats', 1)).toBe(page);
    expect(cache.get('cats', 2)).toBe(pageTwo);
  });

  it('should evict the oldest entry, when the cache exceeds its capacity', () => {
    TestBed.configureTestingModule({});
    const cache = TestBed.inject(SearchResultsCache);
    for (let i = 0; i < 30; i++) {
      cache.set(`query-${i}`, 1, { results: [], totalCount: 0, pageCount: 0 });
    }

    cache.set('query-30', 1, { results: [], totalCount: 0, pageCount: 0 });

    expect(cache.get('query-0', 1)).toBeUndefined();
    expect(cache.get('query-30', 1)).toBeDefined();
  });

  it('should evict the least recently READ entry, not the least recently written', () => {
    TestBed.configureTestingModule({});
    const cache = TestBed.inject(SearchResultsCache);
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
    TestBed.configureTestingModule({});
    const cache = TestBed.inject(SearchResultsCache);
    cache.set('cats', 1, page);

    vi.advanceTimersByTime(CACHE_TTL_MS + 1);

    expect(cache.get('cats', 1)).toBeUndefined();
    vi.useRealTimers();
  });

  it('should still serve an entry just inside the TTL', () => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
    const cache = TestBed.inject(SearchResultsCache);
    cache.set('cats', 1, page);

    vi.advanceTimersByTime(CACHE_TTL_MS - 1);

    expect(cache.get('cats', 1)).toBe(page);
    vi.useRealTimers();
  });

  it('should return undefined, when the entry is older than the TTL', () => {
    let now = 0;
    TestBed.configureTestingModule({ providers: [{ provide: CLOCK, useValue: () => now }] });
    const cache = TestBed.inject(SearchResultsCache);

    cache.set('cats', 1, { results: [], totalCount: 0, pageCount: 0 });
    now = CACHE_TTL_MS;

    expect(cache.get('cats', 1)).toBeUndefined();
  });
});
