import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { ReplaySubject } from 'rxjs';
import { QueryHistoryRecordingEffects } from './query-history-recording.effects';
import { QueryHistoryActions } from '@query-history';
import { SearchApiActions, type SearchResult } from '@search';
import { CLOCK } from '@core/time/clock.token';

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

describe('QueryHistoryRecordingEffects', () => {
  let actions$: ReplaySubject<unknown>;
  let effects: QueryHistoryRecordingEffects;
  const fixedTime = 1735689600000;

  beforeEach(() => {
    vi.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00Z'));
    actions$ = new ReplaySubject(1);
    TestBed.configureTestingModule({
      providers: [
        QueryHistoryRecordingEffects,
        provideMockActions(() => actions$),
        { provide: CLOCK, useValue: () => fixedTime },
      ],
    });
    effects = TestBed.inject(QueryHistoryRecordingEffects);
  });

  afterEach(() => vi.useRealTimers());

  it('should record the query, when page 1 returns at least one result', async () => {
    const emitted = await new Promise((resolve) => {
      effects.recordMeaningfulQuery$.subscribe(resolve);
      actions$.next(
        SearchApiActions.loadResultsSuccess({
          query: 'cats',
          page: 1,
          results: [makeResult('1')],
          totalCount: 5,
          pageCount: 1,
        }),
      );
    });

    expect(emitted).toEqual(
      QueryHistoryActions.queryRecorded({ query: 'cats', usedAt: fixedTime }),
    );
  });

  it('should not record, when the page returned zero results', () => {
    const emitted: unknown[] = [];
    effects.recordMeaningfulQuery$.subscribe((action: unknown) => emitted.push(action));
    actions$.next(
      SearchApiActions.loadResultsSuccess({
        query: 'cats',
        page: 1,
        results: [],
        totalCount: 0,
        pageCount: 0,
      }),
    );

    expect(emitted).toEqual([]);
  });

  it('should not record, when the success is for a page-2 (load more) result', () => {
    const emitted: unknown[] = [];
    effects.recordMeaningfulQuery$.subscribe((action: unknown) => emitted.push(action));
    actions$.next(
      SearchApiActions.loadResultsSuccess({
        query: 'cats',
        page: 2,
        results: [],
        totalCount: 5,
        pageCount: 2,
      }),
    );

    expect(emitted).toEqual([]);
  });
});
