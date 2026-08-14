import { TestBed } from '@angular/core/testing';
import { provideState, provideStore, Store } from '@ngrx/store';
import { QueryHistoryFacade } from './query-history.facade';
import { queryHistoryFeature } from './state/query-history.reducer';
import { QueryHistoryActions } from './state/query-history.actions';

describe('QueryHistoryFacade', () => {
  it('should expose recorded entries as a signal, when a query is recorded', () => {
    TestBed.configureTestingModule({
      providers: [provideStore(), provideState(queryHistoryFeature)],
    });

    const facade = TestBed.runInInjectionContext(() => new QueryHistoryFacade());
    const store = TestBed.inject(Store);

    expect(facade.entries()).toEqual([]);

    store.dispatch(QueryHistoryActions.queryRecorded({ query: 'cats', usedAt: 1 }));

    expect(facade.entries()).toEqual([
      { query: 'cats', canonicalQuery: 'cats', words: ['cats'], lastUsedAt: 1 },
    ]);
  });
});
