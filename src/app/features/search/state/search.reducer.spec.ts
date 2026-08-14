import { searchFeature, searchResultsAdapter, initialState } from './search.reducer';
import { SearchPageActions, SearchActions, SearchApiActions } from './search.actions';
import { SearchResult } from '../domain/search-result.model';

const { reducer } = searchFeature;

function makeResult(id: string): SearchResult {
  return {
    id,
    title: id,
    imageUrl: '',
    thumbnailUrl: '',
    width: 0,
    height: 0,
    creator: null,
    sourceUrl: '',
  };
}

describe('search reducer', () => {
  const activeCatsState = { ...initialState, activeQuery: 'cats' as const };

  it('should return the initial state, when the action is unknown', () => {
    const state = reducer(undefined, { type: '@@INIT' });
    expect(state.status).toBe('idle');
    expect(state.ids).toEqual([]);
  });

  it('should clear previous results and set status to loading, when searchRequested is dispatched', () => {
    const withResults = searchResultsAdapter.setAll([makeResult('1')], {
      ...initialState,
      status: 'success' as const,
    });
    const state = reducer(withResults, SearchActions.searchRequested({ query: 'cats' }));

    expect(state.status).toBe('loading');
    expect(state.activeQuery).toBe('cats');
    expect(state.ids).toEqual([]);
  });

  it('should replace entities, when loadResultsSuccess is dispatched for page 1', () => {
    const state = reducer(
      activeCatsState,
      SearchApiActions.loadResultsSuccess({
        query: 'cats',
        page: 1,
        results: [makeResult('1')],
        totalCount: 50,
        pageCount: 3,
      }),
    );

    expect(state.ids).toEqual(['1']);
    expect(state.status).toBe('success');
    expect(state.page).toBe(1);
    expect(state.pageCount).toBe(3);
  });

  it('should append entities, when loadResultsSuccess is dispatched for a page greater than 1', () => {
    const afterPageOne = reducer(
      activeCatsState,
      SearchApiActions.loadResultsSuccess({
        query: 'cats',
        page: 1,
        results: [makeResult('1')],
        totalCount: 50,
        pageCount: 3,
      }),
    );
    const afterPageTwo = reducer(
      afterPageOne,
      SearchApiActions.loadResultsSuccess({
        query: 'cats',
        page: 2,
        results: [makeResult('2')],
        totalCount: 50,
        pageCount: 3,
      }),
    );

    expect(afterPageTwo.ids).toEqual(['1', '2']);
    expect(afterPageTwo.page).toBe(2);
  });

  it('should set an error message and status, when the initial search fails', () => {
    const loadingState = { ...activeCatsState, status: 'loading' as const };
    const state = reducer(loadingState, SearchApiActions.loadResultsFailure({ query: 'cats', page: 1, message: 'boom' }));

    expect(state.status).toBe('error');
    expect(state.error).toBe('boom');
  });

  it('should ignore a stale failure, when nobody is waiting on the request anymore', () => {
    const successState = {
      ...activeCatsState,
      ...searchResultsAdapter.setAll([makeResult('1')], activeCatsState),
      status: 'success' as const,
    };
    const state = reducer(successState, SearchApiActions.loadResultsFailure({ query: 'cats', page: 1, message: 'boom' }));

    expect(state).toBe(successState);
  });

  it('should set loadingMoreError (not error) and keep existing results, when a load-more request fails', () => {
    const loadingMoreState = {
      ...activeCatsState,
      ...searchResultsAdapter.setAll([makeResult('1')], activeCatsState),
      status: 'loadingMore' as const,
      page: 1,
      pageCount: 3,
    };

    const state = reducer(
      loadingMoreState,
      SearchApiActions.loadResultsFailure({ query: 'cats', page: 2, message: 'boom' }),
    );

    expect(state.status).toBe('loadingMoreError');
    expect(state.error).toBe('boom');
    expect(state.ids).toEqual(['1']);
  });

  it('should return the identical state object, when queryCleared arrives on already-idle state', () => {
    const next = searchFeature.reducer(initialState, SearchActions.queryCleared());

    expect(next).toBe(initialState);
  });

  it('should still clear results, when queryCleared arrives after a successful search', () => {
    const populated = searchFeature.reducer(
      initialState,
      SearchActions.searchRequested({ query: 'cats' }),
    );

    const next = searchFeature.reducer(populated, SearchActions.queryCleared());

    expect(next.activeQuery).toBeNull();
    expect(next.status).toBe('idle');
    expect(next.ids).toHaveLength(0);
  });

  it('should reset to idle, when queryCleared is dispatched', () => {
    const afterPageOne = reducer(
      activeCatsState,
      SearchApiActions.loadResultsSuccess({
        query: 'cats',
        page: 1,
        results: [makeResult('1')],
        totalCount: 50,
        pageCount: 3,
      }),
    );
    const state = reducer(afterPageOne, SearchActions.queryCleared());

    expect(state.status).toBe('idle');
    expect(state.activeQuery).toBeNull();
    expect(state.ids).toEqual([]);
  });

  it('should ignore loadResultsSuccess, when the query is no longer active', () => {
    const afterDogsRequested = reducer(
      initialState,
      SearchActions.searchRequested({ query: 'dogs' }),
    );

    const state = reducer(
      afterDogsRequested,
      SearchApiActions.loadResultsSuccess({
        query: 'cats',
        page: 1,
        results: [makeResult('1')],
        totalCount: 50,
        pageCount: 3,
      }),
    );

    expect(state).toBe(afterDogsRequested);
    expect(state.activeQuery).toBe('dogs');
    expect(state.ids).toEqual([]);
  });

  it('should move to loadingMore, when there is a next page and the previous load succeeded', () => {
    const canLoadMore = { ...initialState, status: 'success' as const, page: 1, pageCount: 3 };
    const noMorePages = { ...initialState, status: 'success' as const, page: 3, pageCount: 3 };

    expect(reducer(canLoadMore, SearchPageActions.nextPageRequested()).status).toBe('loadingMore');
    expect(reducer(noMorePages, SearchPageActions.nextPageRequested()).status).toBe('success');
  });

  it('should move back to loadingMore without clearing results, when retrying a failed load-more', () => {
    const canRetry = {
      ...activeCatsState,
      ...searchResultsAdapter.setAll([makeResult('1')], activeCatsState),
      status: 'loadingMoreError' as const,
      error: 'boom',
      page: 1,
      pageCount: 3,
    };
    const noMorePages = {
      ...initialState,
      status: 'loadingMoreError' as const,
      page: 3,
      pageCount: 3,
    };

    const state = reducer(canRetry, SearchPageActions.nextPageRequested());
    expect(state.status).toBe('loadingMore');
    expect(state.error).toBeNull();
    expect(state.ids).toEqual(['1']);

    expect(reducer(noMorePages, SearchPageActions.nextPageRequested()).status).toBe(
      'loadingMoreError',
    );
  });

  describe('stale failure correlation', () => {
    const loadingState = {
      ...initialState,
      activeQuery: 'dog',
      status: 'loading' as const,
    };

    it('should ignore a failure for a query that is no longer active', () => {
      const next = searchFeature.reducer(
        loadingState,
        SearchApiActions.loadResultsFailure({ query: 'cat', page: 2, message: 'boom' }),
      );

      expect(next.status).toBe('loading');
      expect(next.error).toBeNull();
    });

    it('should apply a failure for page 1 of the active query while loading', () => {
      const next = searchFeature.reducer(
        loadingState,
        SearchApiActions.loadResultsFailure({ query: 'dog', page: 1, message: 'boom' }),
      );

      expect(next.status).toBe('error');
      expect(next.error).toBe('boom');
    });

    it('should apply a failure for the next page of the active query while loading more', () => {
      const next = searchFeature.reducer(
        { ...initialState, activeQuery: 'dog', status: 'loadingMore', page: 1, pageCount: 3 },
        SearchApiActions.loadResultsFailure({ query: 'dog', page: 2, message: 'boom' }),
      );

      expect(next.status).toBe('loadingMoreError');
      expect(next.error).toBe('boom');
    });

    it('should ignore a failure for a page other than the one being awaited', () => {
      const next = searchFeature.reducer(
        { ...initialState, activeQuery: 'dog', status: 'loadingMore', page: 1, pageCount: 5 },
        SearchApiActions.loadResultsFailure({ query: 'dog', page: 4, message: 'boom' }),
      );

      expect(next.status).toBe('loadingMore');
      expect(next.error).toBeNull();
    });
  });
});

describe('search selectors', () => {
  it('should return true only when page is less than pageCount, when selectHasMoreResults is selected', () => {
    expect(
      searchFeature.selectHasMoreResults({ search: { ...initialState, page: 1, pageCount: 3 } }),
    ).toBe(true);
    expect(
      searchFeature.selectHasMoreResults({ search: { ...initialState, page: 3, pageCount: 3 } }),
    ).toBe(false);
  });

  it('should return true only when status is loadingMoreError, when selectIsLoadingMoreError is selected', () => {
    expect(
      searchFeature.selectIsLoadingMoreError({
        search: { ...initialState, status: 'loadingMoreError' },
      }),
    ).toBe(true);
    expect(
      searchFeature.selectIsLoadingMoreError({ search: { ...initialState, status: 'error' } }),
    ).toBe(false);
  });
});
