import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, ReplaySubject, of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpFailure } from '@core/http/http-failure.model';
import { SearchEffects } from './search.effects';
import { SearchPageActions, SearchActions, SearchApiActions } from './search.actions';
import { SearchRepository } from '../data-access/search-repository.service';
import { initialState } from './search.reducer';

describe('SearchEffects', () => {
  let actions$: ReplaySubject<unknown>;
  let effects: SearchEffects;
  let repository: { search: ReturnType<typeof vi.fn> };
  let store: MockStore;

  const mappedPage = { results: [], totalCount: 0, pageCount: 1 };

  beforeEach(() => {
    vi.useFakeTimers();
    actions$ = new ReplaySubject(1);
    repository = { search: vi.fn(() => of(mappedPage)) };

    TestBed.configureTestingModule({
      providers: [
        SearchEffects,
        provideMockActions(() => actions$),
        provideMockStore({ initialState: { search: initialState } }),
        { provide: SearchRepository, useValue: repository },
      ],
    });

    effects = TestBed.inject(SearchEffects);
    store = TestBed.inject(Store) as MockStore;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should dispatch loadResultsSuccess with the repository result, when performSearch$ runs', async () => {
    const page = {
      results: [
        {
          id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          title: 'A cat',
          imageUrl: 'https://images.example.org/full.jpg',
          thumbnailUrl: 'https://images.example.org/thumb.jpg',
          width: 1024,
          height: 768,
          creator: null,
          sourceUrl: 'https://images.example.org/source',
        },
      ],
      totalCount: 1,
      pageCount: 1,
    };
    repository.search.mockReturnValue(of(page));

    const emitted = await new Promise((resolve) => {
      effects.performSearch$.subscribe(resolve);
      actions$.next(SearchActions.searchRequested({ query: 'cats' }));
    });

    expect(repository.search).toHaveBeenCalledWith('cats', 1);
    expect(emitted).toEqual(
      SearchApiActions.loadResultsSuccess({ query: 'cats', page: 1, ...page }),
    );
  });

  it('should dispatch loadResultsFailure, when the repository errors', async () => {
    const failure = new HttpFailure('server', 500, new HttpErrorResponse({ status: 500 }));
    repository.search.mockReturnValue(throwError(() => failure));

    const emitted = await new Promise((resolve) => {
      effects.performSearch$.subscribe(resolve);
      actions$.next(SearchActions.searchRequested({ query: 'cats' }));
    });

    expect(emitted).toEqual(
      SearchApiActions.loadResultsFailure({ query: 'cats', page: 1, kind: failure.kind }),
    );
  });

  it('should be a no-op, when loadNextPage$ runs and there is no next page', () => {
    store.setState({
      search: { ...initialState, status: 'success', page: 3, pageCount: 3, activeQuery: 'cats' },
    });

    const results: unknown[] = [];
    effects.loadNextPage$.subscribe((action) => results.push(action));
    actions$.next(SearchPageActions.nextPageRequested());

    expect(results).toEqual([]);
  });

  it('should request the next page, when loadNextPage$ runs and one is available', async () => {
    store.setState({
      search: {
        ...initialState,
        status: 'loadingMore',
        page: 1,
        pageCount: 3,
        activeQuery: 'cats',
      },
    });

    const emitted = await new Promise((resolve) => {
      effects.loadNextPage$.subscribe(resolve);
      actions$.next(SearchPageActions.nextPageRequested());
    });

    expect(repository.search).toHaveBeenCalledWith('cats', 2);
    expect((emitted as { page: number }).page).toBe(2);
  });

  it('should re-issue the active query, when retry$ runs after an initial-search failure', async () => {
    store.setState({ search: { ...initialState, status: 'error', activeQuery: 'cats' } });

    const emitted = await new Promise((resolve) => {
      effects.retry$.subscribe(resolve);
      actions$.next(SearchActions.retryRequested());
    });

    expect(emitted).toEqual(SearchActions.searchRequested({ query: 'cats' }));
  });

  it('should re-request just the next page, when retry$ runs after a load-more failure', async () => {
    store.setState({
      search: { ...initialState, status: 'loadingMoreError', activeQuery: 'cats', page: 1 },
    });

    const emitted = await new Promise((resolve) => {
      effects.retry$.subscribe(resolve);
      actions$.next(SearchActions.retryRequested());
    });

    expect(emitted).toEqual(SearchPageActions.nextPageRequested());
  });

  it('should unsubscribe the in-flight request, when a newer search is requested', () => {
    let cancelled = false;
    repository.search.mockImplementation((query: string) =>
      query === 'cats'
        ? new Observable(() => () => {
            cancelled = true;
          })
        : of(mappedPage),
    );

    effects.performSearch$.subscribe();
    actions$.next(SearchActions.searchRequested({ query: 'cats' }));
    actions$.next(SearchActions.searchRequested({ query: 'dogs' }));

    expect(cancelled, 'switchMap should have torn down the first request').toBe(true);
  });

  it('should unsubscribe the in-flight request, when the query is cleared', () => {
    let cancelled = false;
    repository.search.mockImplementation(
      () =>
        new Observable(() => () => {
          cancelled = true;
        }),
    );

    effects.performSearch$.subscribe();
    actions$.next(SearchActions.searchRequested({ query: 'cats' }));
    actions$.next(SearchActions.queryCleared());

    expect(cancelled, 'clearing the query should tear down the in-flight request').toBe(true);
  });

  it('should emit nothing, when retry$ runs with no active query', () => {
    store.setState({ search: { ...initialState, status: 'error', activeQuery: null } });

    const results: unknown[] = [];
    effects.retry$.subscribe((action) => results.push(action));
    actions$.next(SearchActions.retryRequested());

    expect(results).toEqual([]);
  });
});
