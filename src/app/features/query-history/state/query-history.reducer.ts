import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { createFeature, createReducer, on } from '@ngrx/store';
import { toCanonicalQuery } from '../../search/domain/to-canonical-query';
import { QueryHistoryEntry } from '../domain/query-history-entry.model';
import { QueryHistoryActions } from './query-history.actions';

export const MAX_QUERY_HISTORY_ENTRIES = 50;

export type QueryHistoryState = EntityState<QueryHistoryEntry>;

export const queryHistoryAdapter = createEntityAdapter<QueryHistoryEntry>({
  selectId: (entry) => entry.canonicalQuery,
});

export const initialState: QueryHistoryState = queryHistoryAdapter.getInitialState();

function evictLeastRecentlyUsed(state: QueryHistoryState): QueryHistoryState {
  if (state.ids.length <= MAX_QUERY_HISTORY_ENTRIES) {
    return state;
  }
  const surplus = state.ids.length - MAX_QUERY_HISTORY_ENTRIES;
  const staleIds = [...state.ids]
    .map((id) => state.entities[String(id)])
    .filter((entry): entry is QueryHistoryEntry => entry !== undefined)
    .sort((a, b) => a.lastUsedAt - b.lastUsedAt)
    .slice(0, surplus)
    .map((entry) => entry.canonicalQuery);

  return queryHistoryAdapter.removeMany(staleIds, state);
}

const queryHistoryReducer = createReducer(
  initialState,
  on(QueryHistoryActions.queryRecorded, (state, { query, usedAt }) => {
    const canonicalQuery = toCanonicalQuery(query);
    const entry: QueryHistoryEntry = {
      query,
      canonicalQuery,
      words: canonicalQuery.split(' ').filter((word) => word.length > 0),
      lastUsedAt: usedAt,
    };
    return evictLeastRecentlyUsed(queryHistoryAdapter.upsertOne(entry, state));
  }),
);

export const queryHistoryFeature = createFeature({
  name: 'queryHistory',
  reducer: queryHistoryReducer,
  extraSelectors: ({ selectQueryHistoryState }) => ({
    ...queryHistoryAdapter.getSelectors(selectQueryHistoryState),
  }),
});

export const { selectQueryHistoryState, selectAll: selectQueryHistoryEntries } =
  queryHistoryFeature;
