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
  it('returns the initial state for an unknown action', () => {
    const state = reducer(undefined, { type: '@@INIT' });
    expect(state.status).toBe('idle');
    expect(state.ids).toEqual([]);
  });

  it('clears previous results and sets status to loading on searchRequested', () => {
    const withResults = searchResultsAdapter.setAll([makeResult('1')], {
      ...initialState,
      status: 'success' as const,
    });
    const state = reducer(withResults, SearchActions.searchRequested({ query: 'cats' }));

    expect(state.status).toBe('loading');
    expect(state.activeQuery).toBe('cats');
    expect(state.ids).toEqual([]);
  });

  it('replaces entities on a page-1 success', () => {
    const state = reducer(
      initialState,
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

  it('appends entities on a page>1 success', () => {
    const afterPageOne = reducer(
      initialState,
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

  it('sets an error message and status on failure without clearing existing results', () => {
    const afterPageOne = reducer(
      initialState,
      SearchApiActions.loadResultsSuccess({
        query: 'cats',
        page: 1,
        results: [makeResult('1')],
        totalCount: 50,
        pageCount: 3,
      }),
    );
    const state = reducer(afterPageOne, SearchApiActions.loadResultsFailure({ message: 'boom' }));

    expect(state.status).toBe('error');
    expect(state.error).toBe('boom');
    expect(state.ids).toEqual(['1']);
  });

  it('resets to idle on queryCleared', () => {
    const afterPageOne = reducer(
      initialState,
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

  it('moves to loadingMore only when there is a next page and the previous load succeeded', () => {
    const canLoadMore = { ...initialState, status: 'success' as const, page: 1, pageCount: 3 };
    const noMorePages = { ...initialState, status: 'success' as const, page: 3, pageCount: 3 };

    expect(reducer(canLoadMore, SearchPageActions.nextPageRequested()).status).toBe('loadingMore');
    expect(reducer(noMorePages, SearchPageActions.nextPageRequested()).status).toBe('success');
  });
});

describe('search selectors', () => {
  it('selectHasMoreResults is true only when page < pageCount', () => {
    expect(
      searchFeature.selectHasMoreResults({ search: { ...initialState, page: 1, pageCount: 3 } }),
    ).toBe(true);
    expect(
      searchFeature.selectHasMoreResults({ search: { ...initialState, page: 3, pageCount: 3 } }),
    ).toBe(false);
  });
});
