import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { filter, map } from 'rxjs/operators';
import { SearchApiActions } from '@search';
import { QueryHistoryActions, isRecordableResult } from '@query-history';
import { CLOCK } from '@core/time/clock.token';

@Injectable()
export class QueryHistoryRecordingEffects {
  private readonly actions$ = inject(Actions);
  private readonly now = inject(CLOCK);

  recordMeaningfulQuery$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SearchApiActions.loadResultsSuccess),
      filter(({ page, totalCount }) => isRecordableResult(page, totalCount)),
      map(({ query }) => QueryHistoryActions.queryRecorded({ query, usedAt: this.now() })),
    ),
  );
}
