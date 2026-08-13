import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { ReplaySubject } from 'rxjs';
import { QueryHistoryEffects } from './query-history.effects';
import { QueryHistoryActions } from './query-history.actions';
import { SearchApiActions } from '../../search/state/search.actions';

describe('QueryHistoryEffects', () => {
  let actions$: ReplaySubject<unknown>;
  let effects: QueryHistoryEffects;

  beforeEach(() => {
    vi.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00Z'));
    actions$ = new ReplaySubject(1);
    TestBed.configureTestingModule({
      providers: [QueryHistoryEffects, provideMockActions(() => actions$)],
    });
    effects = TestBed.inject(QueryHistoryEffects);
  });

  afterEach(() => vi.useRealTimers());

  it('records the query when page 1 returns at least one result', async () => {
    const emitted = await new Promise((resolve) => {
      effects.recordMeaningfulQuery$.subscribe(resolve);
      actions$.next(
        SearchApiActions.loadResultsSuccess({
          query: 'cats',
          page: 1,
          results: [],
          totalCount: 5,
          pageCount: 1,
        }),
      );
    });

    expect(emitted).toEqual(
      QueryHistoryActions.queryRecorded({ query: 'cats', usedAt: Date.now() }),
    );
  });

  it('does not record when the page returned zero results', () => {
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

  it('does not record for a page-2 (load more) success', () => {
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
