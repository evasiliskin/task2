import { TestBed } from '@angular/core/testing';
import { provideState, provideStore, Store } from '@ngrx/store';
import { QueryHistoryFacade } from './query-history.facade';
import { QueryHistoryActions } from './state/query-history.actions';
import { queryHistoryFeature } from './state/query-history.reducer';

describe('QueryHistoryFacade', () => {
  function configure(): { facade: QueryHistoryFacade; store: Store } {
    TestBed.configureTestingModule({
      providers: [provideStore(), provideState(queryHistoryFeature)],
    });

    return { facade: TestBed.inject(QueryHistoryFacade), store: TestBed.inject(Store) };
  }

  it('should expose no entries, when no query has been recorded', () => {
    const { facade } = configure();

    expect(facade.entries()).toEqual([]);
  });

  it('should expose the recorded entry, when a query is recorded', () => {
    const { facade, store } = configure();

    store.dispatch(QueryHistoryActions.queryRecorded({ query: 'cats', usedAt: 1 }));

    expect(facade.entries()).toEqual([
      { query: 'cats', canonicalQuery: 'cats', words: ['cats'], lastUsedAt: 1 },
    ]);
  });

  it('should expose every recorded entry with its timestamp, when several queries are recorded', () => {
    const { facade, store } = configure();

    store.dispatch(QueryHistoryActions.queryRecorded({ query: 'cats', usedAt: 1 }));
    store.dispatch(QueryHistoryActions.queryRecorded({ query: 'mountains', usedAt: 2 }));

    expect(facade.entries().map((entry) => [entry.query, entry.lastUsedAt])).toEqual([
      ['cats', 1],
      ['mountains', 2],
    ]);
  });
});
