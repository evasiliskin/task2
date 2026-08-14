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
  takeUntil,
  tap,
  withLatestFrom,
} from 'rxjs/operators';
import { SEARCH_RESULTS_PAGE_SIZE } from '../../../core/api/openverse/openverse-api.config';
import { isNormalizedHttpError } from '../../../core/http/http-error.interceptor';
import { OpenverseApi } from '../data-access/openverse-api.service';
import { InvalidApiResponseError } from '../data-access/openverse-response.guard';
import { mapOpenverseSearchResponse } from '../data-access/search-result.mapper';
import { SearchResultsCache } from '../data-access/search-results-cache.service';
import { isMeaningfulQuery } from '../domain/is-meaningful-query';
import { normalizeSearchQuery } from '../domain/normalize-search-query';
import { SearchActions, SearchApiActions, SearchPageActions } from './search.actions';
import { isActivePaginationContext, selectPaginationContext } from './search.reducer';

@Injectable()
export class SearchEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly openverseApi = inject(OpenverseApi);
  private readonly cache = inject(SearchResultsCache);

  private readonly queryInvalidated$ = this.actions$.pipe(
    ofType(SearchActions.searchRequested, SearchActions.queryCleared),
  );

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
      withLatestFrom(this.store.select(selectPaginationContext)),
      map(([, context]) => context),
      filter((context) => context.status === 'loadingMore'),
      filter(isActivePaginationContext),
      exhaustMap((context) =>
        this.loadPage(context.activeQuery, context.page + 1).pipe(
          takeUntil(this.queryInvalidated$),
        ),
      ),
    ),
  );

  retry$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SearchActions.retryRequested),
      withLatestFrom(this.store.select(selectPaginationContext)),
      map(([, context]) => context),
      filter(isActivePaginationContext),
      map((context) =>
        context.status === 'loadingMoreError'
          ? SearchPageActions.nextPageRequested()
          : SearchActions.searchRequested({ query: context.activeQuery }),
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
      tap((mapped) => this.cache.set(query, page, mapped)),
      map((mapped) => SearchApiActions.loadResultsSuccess({ query, page, ...mapped })),
      catchError((error: unknown) =>
        of(
          SearchApiActions.loadResultsFailure({
            query,
            page,
            message: this.toFailureMessage(error),
          }),
        ),
      ),
    );
  }

  private toFailureMessage(error: unknown): string {
    if (error instanceof InvalidApiResponseError) {
      return 'The image service returned unexpected data. Please try again.';
    }
    if (isNormalizedHttpError(error)) {
      return error.message;
    }
    return 'Something went wrong. Please try again.';
  }
}
