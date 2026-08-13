import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { createFeature, createReducer, createSelector, on } from '@ngrx/store';
import { SearchResult } from '../domain/search-result.model';
import { SearchActions, SearchApiActions, SearchPageActions } from './search.actions';

export type SearchStatus =
  'idle' | 'loading' | 'loadingMore' | 'success' | 'error' | 'loadingMoreError';

export interface SearchState extends EntityState<SearchResult> {
  readonly activeQuery: string | null;
  readonly status: SearchStatus;
  readonly error: string | null;
  readonly page: number;
  readonly totalCount: number;
  readonly pageCount: number;
}

export const searchResultsAdapter = createEntityAdapter<SearchResult>();

export const initialState: SearchState = searchResultsAdapter.getInitialState({
  activeQuery: null,
  status: 'idle',
  error: null,
  page: 0,
  totalCount: 0,
  pageCount: 0,
});

export const searchFeature = createFeature({
  name: 'search',
  reducer: createReducer(
    initialState,
    on(SearchActions.searchRequested, (state, { query }) =>
      searchResultsAdapter.removeAll({
        ...state,
        activeQuery: query,
        status: 'loading',
        error: null,
        page: 0,
        totalCount: 0,
        pageCount: 0,
      }),
    ),
    on(SearchActions.queryCleared, (state) =>
      searchResultsAdapter.removeAll({
        ...state,
        activeQuery: null,
        status: 'idle',
        error: null,
        page: 0,
        totalCount: 0,
        pageCount: 0,
      }),
    ),
    on(SearchPageActions.nextPageRequested, (state) =>
      (state.status === 'success' || state.status === 'loadingMoreError') &&
      state.page < state.pageCount
        ? { ...state, status: 'loadingMore', error: null }
        : state,
    ),
    on(
      SearchApiActions.loadResultsSuccess,
      (state, { query, page, results, totalCount, pageCount }) => {
        if (query !== state.activeQuery) {
          return state;
        }
        const withResults =
          page === 1
            ? searchResultsAdapter.setAll(results, state)
            : searchResultsAdapter.upsertMany(results, state);
        return {
          ...withResults,
          status: 'success' as const,
          error: null,
          page,
          totalCount,
          pageCount,
        };
      },
    ),
    on(SearchApiActions.loadResultsFailure, (state, { message }) => {
      if (state.status === 'loadingMore') {
        return { ...state, status: 'loadingMoreError' as const, error: message };
      }
      if (state.status === 'loading') {
        return { ...state, status: 'error' as const, error: message };
      }
      // A failure for a request nobody is waiting on anymore (e.g. an orphaned
      // page-2 fetch that resolves after the query changed) must not clobber
      // whatever the store has moved on to.
      return state;
    }),
  ),
  extraSelectors: ({ selectSearchState, selectStatus, selectPage, selectPageCount }) => ({
    ...searchResultsAdapter.getSelectors(selectSearchState),
    selectHasMoreResults: createSelector(
      selectPage,
      selectPageCount,
      (page, pageCount) => page < pageCount,
    ),
    selectIsLoadingMore: createSelector(selectStatus, (status) => status === 'loadingMore'),
    selectIsLoadingMoreError: createSelector(
      selectStatus,
      (status) => status === 'loadingMoreError',
    ),
  }),
});

export const {
  selectSearchState,
  selectActiveQuery,
  selectStatus,
  selectError,
  selectPage,
  selectTotalCount,
  selectPageCount,
  selectAll: selectSearchResults,
  selectHasMoreResults,
  selectIsLoadingMore,
  selectIsLoadingMoreError,
} = searchFeature;
