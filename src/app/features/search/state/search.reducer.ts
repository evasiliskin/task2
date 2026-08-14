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
    on(SearchApiActions.loadResultsFailure, (state, { query, page, message }) => {
      if (query !== state.activeQuery) {
        return state;
      }
      if (state.status === 'loadingMore' && page === state.page + 1) {
        return { ...state, status: 'loadingMoreError' as const, error: message };
      }
      if (state.status === 'loading' && page === 1) {
        return { ...state, status: 'error' as const, error: message };
      }
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

export interface PaginationContext {
  readonly activeQuery: string | null;
  readonly status: SearchStatus;
  readonly page: number;
}

export type ActivePaginationContext = PaginationContext & { readonly activeQuery: string };

export const selectPaginationContext = createSelector(
  searchFeature.selectActiveQuery,
  searchFeature.selectStatus,
  searchFeature.selectPage,
  (activeQuery, status, page): PaginationContext => ({ activeQuery, status, page }),
);

export function isActivePaginationContext(
  context: PaginationContext,
): context is ActivePaginationContext {
  return context.activeQuery !== null;
}

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
