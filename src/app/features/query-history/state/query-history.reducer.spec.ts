import { queryHistoryFeature, MAX_QUERY_HISTORY_ENTRIES } from './query-history.reducer';
import { QueryHistoryActions } from './query-history.actions';

const { reducer, initialState } = queryHistoryFeature;

describe('query-history reducer', () => {
  it('should add a new entry, when queryRecorded is dispatched for a new query', () => {
    const state = reducer(
      initialState,
      QueryHistoryActions.queryRecorded({ query: 'cats', usedAt: 100 }),
    );
    expect(state.ids).toEqual(['cats']);
    expect(state.entities['cats']).toEqual({
      query: 'cats',
      canonicalQuery: 'cats',
      words: ['cats'],
      lastUsedAt: 100,
    });
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
    expect(second.entities['cats']).toEqual({
      query: 'cats',
      canonicalQuery: 'cats',
      words: ['cats'],
      lastUsedAt: 200,
    });
  });

  it('should store the canonical form and the word list alongside the original query', () => {
    const next = queryHistoryFeature.reducer(
      initialState,
      QueryHistoryActions.queryRecorded({ query: 'Mountain Lake', usedAt: 1 }),
    );

    expect(next.entities['mountain lake']).toEqual({
      query: 'Mountain Lake',
      canonicalQuery: 'mountain lake',
      words: ['mountain', 'lake'],
      lastUsedAt: 1,
    });
  });

  it('should evict the least recently used entry, when the cap is exceeded', () => {
    let state = initialState;
    for (let i = 0; i < MAX_QUERY_HISTORY_ENTRIES + 1; i++) {
      state = queryHistoryFeature.reducer(
        state,
        QueryHistoryActions.queryRecorded({ query: `query ${i}`, usedAt: i }),
      );
    }

    expect(state.ids).toHaveLength(MAX_QUERY_HISTORY_ENTRIES);
    expect(state.entities['query 0']).toBeUndefined();
    expect(state.entities[`query ${MAX_QUERY_HISTORY_ENTRIES}`]).toBeDefined();
  });
});

describe('query-history selectors', () => {
  it('should return all recorded entries, when selectQueryHistoryEntries is selected', () => {
    const state = reducer(
      initialState,
      QueryHistoryActions.queryRecorded({ query: 'cats', usedAt: 100 }),
    );
    expect(queryHistoryFeature.selectQueryHistoryEntries({ queryHistory: state })).toEqual([
      { query: 'cats', canonicalQuery: 'cats', words: ['cats'], lastUsedAt: 100 },
    ]);
  });
});
