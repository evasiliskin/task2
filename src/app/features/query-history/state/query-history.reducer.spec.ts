import { queryHistoryFeature } from './query-history.reducer';
import { QueryHistoryActions } from './query-history.actions';

const { reducer, initialState } = queryHistoryFeature;

describe('query-history reducer', () => {
  it('should add a new entry, when queryRecorded is dispatched for a new query', () => {
    const state = reducer(
      initialState,
      QueryHistoryActions.queryRecorded({ query: 'cats', usedAt: 100 }),
    );
    expect(state.ids).toEqual(['cats']);
    expect(state.entities['cats']).toEqual({ query: 'cats', lastUsedAt: 100 });
  });

  it('should update lastUsedAt instead of duplicating the entry, when queryRecorded is dispatched for an existing query', () => {
    const first = reducer(
      initialState,
      QueryHistoryActions.queryRecorded({ query: 'cats', usedAt: 100 }),
    );
    const second = reducer(
      first,
      QueryHistoryActions.queryRecorded({ query: 'cats', usedAt: 200 }),
    );

    expect(second.ids).toEqual(['cats']);
    expect(second.entities['cats']?.lastUsedAt).toBe(200);
  });

  it('should treat queries that differ only by case as the same entity, when queryRecorded is dispatched', () => {
    const first = reducer(
      initialState,
      QueryHistoryActions.queryRecorded({ query: 'Cats', usedAt: 100 }),
    );
    const second = reducer(
      first,
      QueryHistoryActions.queryRecorded({ query: 'cats', usedAt: 200 }),
    );

    expect(second.ids.length).toBe(1);
    expect(second.entities['cats']).toEqual({ query: 'cats', lastUsedAt: 200 });
  });
});

describe('query-history selectors', () => {
  it('should return all recorded entries, when selectQueryHistoryEntries is selected', () => {
    const state = reducer(
      initialState,
      QueryHistoryActions.queryRecorded({ query: 'cats', usedAt: 100 }),
    );
    expect(queryHistoryFeature.selectQueryHistoryEntries({ queryHistory: state })).toEqual([
      { query: 'cats', lastUsedAt: 100 },
    ]);
  });
});
