import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  exhaustMap,
  filter,
  map,
  switchMap,
  withLatestFrom,
} from 'rxjs/operators';
import { SEARCH_RESULTS_PAGE_SIZE } from '../../../core/api/openverse/openverse-api.config';
import { NormalizedHttpError } from '../../../core/http/http-error.interceptor';
import { OpenverseApi } from '../data-access/openverse-api.service';
import { mapOpenverseSearchResponse } from '../data-access/search-result.mapper';
import { SearchResultsCache } from '../data-access/search-results-cache.service';
import { isMeaningfulQuery } from '../domain/is-meaningful-query';
import { normalizeSearchQuery } from '../domain/normalize-search-query';
import { SearchActions, SearchApiActions, SearchPageActions } from './search.actions';
import { selectSearchState } from './search.reducer';

@Injectable()
export class SearchEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly openverseApi = inject(OpenverseApi);
  private readonly cache = inject(SearchResultsCache);

  debounceQuery$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SearchPageActions.queryTyped),
      debounceTime(300),
      map(({ query }) => normalizeSearchQuery(query)),
      distinctUntilChanged(),
      map((normalizedQuery) =>
        isMeaningfulQuery(normalizedQuery)
          ? SearchActions.searchRequested({ query: normalizedQuery })
          : SearchActions.queryCleared(),
      ),
    ),
  );

  performSearch$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SearchActions.searchRequested),
      switchMap(({ query }) => this.loadPage(query, 1)),
    ),
  );

  loadNextPage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SearchPageActions.nextPageRequested),
      withLatestFrom(this.store.select(selectSearchState)),
      filter(([, state]) => state.status === 'loadingMore' && state.activeQuery !== null),
      exhaustMap(([, state]) => this.loadPage(state.activeQuery as string, state.page + 1)),
    ),
  );

  retry$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SearchActions.retryRequested),
      withLatestFrom(this.store.select(selectSearchState)),
      filter(([, state]) => state.activeQuery !== null),
      map(([, state]) =>
        state.status === 'loadingMoreError'
          ? SearchPageActions.nextPageRequested()
          : SearchActions.searchRequested({ query: state.activeQuery as string }),
      ),
    ),
  );

  private loadPage(query: string, page: number) {
    const cached = this.cache.get(query, page);
    if (cached) {
      return of(SearchApiActions.loadResultsSuccess({ query, page, ...cached }));
    }
    return this.openverseApi.searchImages(query, page, SEARCH_RESULTS_PAGE_SIZE).pipe(
      map(mapOpenverseSearchResponse),
      map((mapped) => {
        this.cache.set(query, page, mapped);
        return SearchApiActions.loadResultsSuccess({ query, page, ...mapped });
      }),
      catchError((error: NormalizedHttpError) =>
        of(SearchApiActions.loadResultsFailure({ message: error.message })),
      ),
    );
  }
}
