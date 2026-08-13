import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { filter, map } from 'rxjs/operators';
import { SearchApiActions } from '../../search/state/search.actions';
import { QueryHistoryActions } from './query-history.actions';

@Injectable()
export class QueryHistoryEffects {
  private readonly actions$ = inject(Actions);

  recordMeaningfulQuery$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SearchApiActions.loadResultsSuccess),
      filter(({ page, totalCount }) => page === 1 && totalCount > 0),
      map(({ query }) => QueryHistoryActions.queryRecorded({ query, usedAt: Date.now() })),
    ),
  );
}
