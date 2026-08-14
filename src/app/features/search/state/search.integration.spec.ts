import { TestBed } from '@angular/core/testing';
import { provideEffects } from '@ngrx/effects';
import { provideState, provideStore, Store } from '@ngrx/store';
import { firstValueFrom, of, Subject, throwError } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { OpenverseApi } from '../data-access/openverse-api.service';
import { SearchResultsCache } from '../data-access/search-results-cache.service';
import { SearchActions, SearchPageActions } from './search.actions';
import { SearchEffects } from './search.effects';
import { searchFeature, selectPage, selectStatus, selectSearchResults } from './search.reducer';

describe('search state integration (real store + real reducer + real effects)', () => {
  it('should load the next page, when the first page has succeeded', async () => {
    const searchImages = vi.fn((query: string, page: number) =>
      of({
        result_count: 4,
        page_count: 2,
        results: [
          {
            id: `${query}-${page}`,
            title: 'Title',
            url: 'u',
            thumbnail: 't',
            width: 1,
            height: 1,
            creator: null,
            foreign_landing_url: 'f',
          },
        ],
      }),
    );
    const cache = { get: vi.fn(() => undefined), set: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideStore(),
        provideState(searchFeature),
        provideEffects(SearchEffects),
        { provide: OpenverseApi, useValue: { searchImages } },
        { provide: SearchResultsCache, useValue: cache },
      ],
    });

    const store = TestBed.inject(Store);

    store.dispatch(SearchActions.searchRequested({ query: 'cats' }));
    await firstValueFrom(
      store.select(selectStatus).pipe(
        filter((status) => status === 'success'),
        take(1),
      ),
    );

    store.dispatch(SearchPageActions.nextPageRequested());
    await firstValueFrom(
      store.select(selectPage).pipe(
        filter((page) => page === 2),
        take(1),
      ),
    );

    expect(searchImages).toHaveBeenCalledTimes(2);
    expect(searchImages).toHaveBeenNthCalledWith(2, 'cats', 2, expect.any(Number));
    expect(await firstValueFrom(store.select(selectStatus).pipe(take(1)))).toBe('success');
  });

  it('should recover from a failed page-2 load without losing page-1 results, when retried', async () => {
    let pageTwoCalls = 0;
    const searchImages = vi.fn((query: string, page: number) => {
      if (page === 2) {
        pageTwoCalls += 1;
        if (pageTwoCalls === 1) {
          return throwError(() => ({ status: 500, message: 'boom' }));
        }
      }
      return of({
        result_count: 4,
        page_count: 2,
        results: [
          {
            id: `${query}-${page}`,
            title: 'Title',
            url: 'u',
            thumbnail: 't',
            width: 1,
            height: 1,
            creator: null,
            foreign_landing_url: 'f',
          },
        ],
      });
    });
    const cache = { get: vi.fn(() => undefined), set: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideStore(),
        provideState(searchFeature),
        provideEffects(SearchEffects),
        { provide: OpenverseApi, useValue: { searchImages } },
        { provide: SearchResultsCache, useValue: cache },
      ],
    });

    const store = TestBed.inject(Store);

    store.dispatch(SearchActions.searchRequested({ query: 'cats' }));
    await firstValueFrom(
      store.select(selectStatus).pipe(
        filter((status) => status === 'success'),
        take(1),
      ),
    );

    store.dispatch(SearchPageActions.nextPageRequested());
    await firstValueFrom(
      store.select(selectStatus).pipe(
        filter((status) => status === 'loadingMoreError'),
        take(1),
      ),
    );

    expect(await firstValueFrom(store.select(selectSearchResults).pipe(take(1)))).toEqual([
      expect.objectContaining({ id: 'cats-1' }),
    ]);

    store.dispatch(SearchActions.retryRequested());
    await firstValueFrom(
      store.select(selectStatus).pipe(
        filter((status) => status === 'success'),
        take(1),
      ),
    );

    expect(searchImages).toHaveBeenCalledTimes(3);
    expect(await firstValueFrom(store.select(selectPage).pipe(take(1)))).toBe(2);
    expect(await firstValueFrom(store.select(selectSearchResults).pipe(take(1)))).toEqual([
      expect.objectContaining({ id: 'cats-1' }),
      expect.objectContaining({ id: 'cats-2' }),
    ]);
  });

  it('should not deadlock pagination, when a new search starts while a page request is still in flight', async () => {
    const pending = new Subject<unknown>();
    const searchImages = vi.fn((query: string, page: number) => {
      if (query === 'cat' && page === 2) {
        return pending.asObservable();
      }
      return of({
        result_count: 40,
        page_count: 2,
        results: [
          {
            id: `${query}-${page}`,
            title: 'Title',
            url: 'u',
            thumbnail: 't',
            width: 1,
            height: 1,
            creator: null,
            foreign_landing_url: 'f',
          },
        ],
      });
    });
    const cache = { get: vi.fn(() => undefined), set: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideStore(),
        provideState(searchFeature),
        provideEffects(SearchEffects),
        { provide: OpenverseApi, useValue: { searchImages } },
        { provide: SearchResultsCache, useValue: cache },
      ],
    });
    const store = TestBed.inject(Store);

    store.dispatch(SearchActions.searchRequested({ query: 'cat' }));
    store.dispatch(SearchPageActions.nextPageRequested());

    store.dispatch(SearchActions.searchRequested({ query: 'dog' }));
    store.dispatch(SearchPageActions.nextPageRequested());

    const status = await firstValueFrom(store.select(selectStatus).pipe(take(1)));
    expect(status).not.toBe('loadingMore');
    expect(searchImages).toHaveBeenCalledWith('dog', 2, 20);

    pending.complete();
  });
});
