import { TestBed } from '@angular/core/testing';
import { provideEffects } from '@ngrx/effects';
import { provideState, provideStore, Store } from '@ngrx/store';
import { firstValueFrom } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { SearchApiActions } from '../../search/state/search.actions';
import { QueryHistoryFacade } from '../query-history.facade';
import { QueryHistoryEffects } from './query-history.effects';
import { queryHistoryFeature } from './query-history.reducer';

function configure() {
  TestBed.configureTestingModule({
    providers: [
      provideStore(),
      provideState(queryHistoryFeature),
      provideEffects(QueryHistoryEffects),
    ],
  });

  return {
    store: TestBed.inject(Store),
    facade: TestBed.inject(QueryHistoryFacade),
  };
}

describe('query-history state integration (real store + real reducer + real effects)', () => {
  it('records a history entry once a first-page search succeeds with results', async () => {
    const { store, facade } = configure();

    store.dispatch(
      SearchApiActions.loadResultsSuccess({
        query: 'cats',
        page: 1,
        results: [],
        totalCount: 5,
        pageCount: 1,
      }),
    );

    await firstValueFrom(
      store.select(queryHistoryFeature.selectQueryHistoryEntries).pipe(
        filter((entries) => entries.length > 0),
        take(1),
      ),
    );

    expect(facade.entries()).toEqual([{ query: 'cats', lastUsedAt: expect.any(Number) }]);
  });

  it('does not record an entry for a page-2 (load more) or zero-result success', async () => {
    const { store, facade } = configure();

    store.dispatch(
      SearchApiActions.loadResultsSuccess({
        query: 'dogs',
        page: 2,
        results: [],
        totalCount: 5,
        pageCount: 2,
      }),
    );
    store.dispatch(
      SearchApiActions.loadResultsSuccess({
        query: 'zero',
        page: 1,
        results: [],
        totalCount: 0,
        pageCount: 0,
      }),
    );
    store.dispatch(
      SearchApiActions.loadResultsSuccess({
        query: 'sentinel',
        page: 1,
        results: [],
        totalCount: 1,
        pageCount: 1,
      }),
    );

    await firstValueFrom(
      store.select(queryHistoryFeature.selectQueryHistoryEntries).pipe(
        filter((entries) => entries.some((entry) => entry.query === 'sentinel')),
        take(1),
      ),
    );

    expect(facade.entries().map((entry) => entry.query)).toEqual(['sentinel']);
  });

  it('treats queries that differ only by case as a single history entry end-to-end', async () => {
    const { store, facade } = configure();

    store.dispatch(
      SearchApiActions.loadResultsSuccess({
        query: 'Cats',
        page: 1,
        results: [],
        totalCount: 5,
        pageCount: 1,
      }),
    );
    store.dispatch(
      SearchApiActions.loadResultsSuccess({
        query: 'cats',
        page: 1,
        results: [],
        totalCount: 5,
        pageCount: 1,
      }),
    );

    await firstValueFrom(
      store.select(queryHistoryFeature.selectQueryHistoryEntries).pipe(
        filter((entries) => entries.some((entry) => entry.query === 'cats')),
        take(1),
      ),
    );

    expect(facade.entries().length).toBe(1);
  });
});
