import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import {
  catchError,
  exhaustMap,
  filter,
  map,
  switchMap,
  takeUntil,
  withLatestFrom,
} from 'rxjs/operators';
import { SearchRepository } from '../data-access/search-repository.service';
import { SearchActions, SearchApiActions, SearchPageActions } from './search.actions';
import { isActivePaginationContext, selectPaginationContext } from './search.reducer';
import { toSearchErrorKind } from './to-search-error-kind';

@Injectable()
export class SearchEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly repository = inject(SearchRepository);

  private readonly queryInvalidated$ = this.actions$.pipe(
    ofType(SearchActions.searchRequested, SearchActions.queryCleared),
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
    return this.repository.search(query, page).pipe(
      map((mapped) => SearchApiActions.loadResultsSuccess({ query, page, ...mapped })),
      catchError((error: unknown) =>
        of(SearchApiActions.loadResultsFailure({ query, page, kind: toSearchErrorKind(error) })),
      ),
    );
  }
}
