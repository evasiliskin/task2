import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { ReplaySubject, of, throwError } from 'rxjs';
import { SearchEffects } from './search.effects';
import { SearchPageActions, SearchActions, SearchApiActions } from './search.actions';
import { OpenverseApi } from '../data-access/openverse-api.service';
import { SearchResultsCache } from '../data-access/search-results-cache.service';
import { initialState } from './search.reducer';

describe('SearchEffects', () => {
  let actions$: ReplaySubject<unknown>;
  let effects: SearchEffects;
  let openverseApi: { searchImages: ReturnType<typeof vi.fn> };
  let cache: { get: ReturnType<typeof vi.fn>; set: ReturnType<typeof vi.fn> };
  let store: MockStore;

  const emptyResponse = { result_count: 0, page_count: 1, results: [] };

  beforeEach(() => {
    vi.useFakeTimers();
    actions$ = new ReplaySubject(1);
    openverseApi = { searchImages: vi.fn(() => of(emptyResponse)) };
    cache = { get: vi.fn(() => undefined), set: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        SearchEffects,
        provideMockActions(() => actions$),
        provideMockStore({ initialState: { search: initialState } }),
        { provide: OpenverseApi, useValue: openverseApi },
        { provide: SearchResultsCache, useValue: cache },
      ],
    });

    effects = TestBed.inject(SearchEffects);
    store = TestBed.inject(Store) as MockStore;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces query typed events and ignores non-meaningful queries', () => {
    const results: unknown[] = [];
    effects.debounceQuery$.subscribe((action) => results.push(action));

    actions$.next(SearchPageActions.queryTyped({ query: 'a' }));
    vi.advanceTimersByTime(300);

    expect(results).toEqual([SearchActions.queryCleared()]);
  });

  it('dispatches searchRequested for a meaningful, debounced and normalized query', () => {
    const results: unknown[] = [];
    effects.debounceQuery$.subscribe((action) => results.push(action));

    actions$.next(SearchPageActions.queryTyped({ query: '  cats  ' }));
    vi.advanceTimersByTime(300);

    expect(results).toEqual([SearchActions.searchRequested({ query: 'cats' })]);
  });

  it('collapses rapid keystrokes into a single request via debounce+distinctUntilChanged', () => {
    const results: unknown[] = [];
    effects.debounceQuery$.subscribe((action) => results.push(action));

    actions$.next(SearchPageActions.queryTyped({ query: 'c' }));
    vi.advanceTimersByTime(100);
    actions$.next(SearchPageActions.queryTyped({ query: 'ca' }));
    vi.advanceTimersByTime(100);
    actions$.next(SearchPageActions.queryTyped({ query: 'cat' }));
    vi.advanceTimersByTime(300);

    expect(results).toEqual([SearchActions.searchRequested({ query: 'cat' })]);
  });

  it('performSearch$ maps a successful API response to loadResultsSuccess and caches it', async () => {
    openverseApi.searchImages.mockReturnValue(
      of({
        result_count: 1,
        page_count: 1,
        results: [
          {
            id: '1',
            title: 'One',
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

    const emitted = await new Promise((resolve) => {
      effects.performSearch$.subscribe(resolve);
      actions$.next(SearchActions.searchRequested({ query: 'cats' }));
    });

    expect(emitted).toEqual(
      SearchApiActions.loadResultsSuccess({
        query: 'cats',
        page: 1,
        results: [
          {
            id: '1',
            title: 'One',
            imageUrl: 'u',
            thumbnailUrl: 't',
            width: 1,
            height: 1,
            creator: null,
            sourceUrl: 'f',
          },
        ],
        totalCount: 1,
        pageCount: 1,
      }),
    );
    expect(cache.set).toHaveBeenCalledWith('cats', 1, {
      results: expect.any(Array),
      totalCount: 1,
      pageCount: 1,
    });
  });

  it('performSearch$ maps a failed API response to loadResultsFailure', async () => {
    openverseApi.searchImages.mockReturnValue(throwError(() => ({ status: 500, message: 'boom' })));

    const emitted = await new Promise((resolve) => {
      effects.performSearch$.subscribe(resolve);
      actions$.next(SearchActions.searchRequested({ query: 'cats' }));
    });

    expect(emitted).toEqual(SearchApiActions.loadResultsFailure({ message: 'boom' }));
  });

  it('performSearch$ serves a cached page without calling the API', async () => {
    const cachedPage = { results: [], totalCount: 5, pageCount: 1 };
    cache.get.mockReturnValue(cachedPage);

    const emitted = await new Promise((resolve) => {
      effects.performSearch$.subscribe(resolve);
      actions$.next(SearchActions.searchRequested({ query: 'cats' }));
    });

    expect(emitted).toEqual(
      SearchApiActions.loadResultsSuccess({ query: 'cats', page: 1, ...cachedPage }),
    );
    expect(openverseApi.searchImages).not.toHaveBeenCalled();
  });

  it('loadNextPage$ is a no-op when there is no next page', () => {
    store.setState({
      search: { ...initialState, status: 'success', page: 3, pageCount: 3, activeQuery: 'cats' },
    });

    const results: unknown[] = [];
    effects.loadNextPage$.subscribe((action) => results.push(action));
    actions$.next(SearchPageActions.nextPageRequested());

    expect(results).toEqual([]);
  });

  it('loadNextPage$ requests the next page when one is available', async () => {
    store.setState({
      search: { ...initialState, status: 'success', page: 1, pageCount: 3, activeQuery: 'cats' },
    });

    const emitted = await new Promise((resolve) => {
      effects.loadNextPage$.subscribe(resolve);
      actions$.next(SearchPageActions.nextPageRequested());
    });

    expect(openverseApi.searchImages).toHaveBeenCalledWith('cats', 2, expect.any(Number));
    expect((emitted as { page: number }).page).toBe(2);
  });

  it('retry$ re-issues the active query', async () => {
    store.setState({ search: { ...initialState, activeQuery: 'cats' } });

    const emitted = await new Promise((resolve) => {
      effects.retry$.subscribe(resolve);
      actions$.next(SearchActions.retryRequested());
    });

    expect(emitted).toEqual(SearchActions.searchRequested({ query: 'cats' }));
  });
});
