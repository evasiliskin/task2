import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { createFeature, createReducer, on } from '@ngrx/store';
import { appConfig } from '@core/config/app-config';
import { QueryHistoryEntry } from '../domain/query-history-entry.model';
import { toQueryHistoryEntry } from '../domain/to-query-history-entry';
import { QueryHistoryActions } from './query-history.actions';

const { maxEntries } = appConfig.queryHistory;

export type QueryHistoryState = EntityState<QueryHistoryEntry>;

export const queryHistoryAdapter = createEntityAdapter<QueryHistoryEntry>({
  selectId: (entry) => entry.canonicalQuery,
});

export const initialState: QueryHistoryState = queryHistoryAdapter.getInitialState();

function evictLeastRecentlyUsed(state: QueryHistoryState): QueryHistoryState {
  if (state.ids.length <= maxEntries) {
    return state;
  }
  const surplus = state.ids.length - maxEntries;
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
  on(QueryHistoryActions.queryRecorded, (state, { query, usedAt }) =>
    evictLeastRecentlyUsed(
      queryHistoryAdapter.upsertOne(toQueryHistoryEntry(query, usedAt), state),
    ),
  ),
);

export const queryHistoryFeature = createFeature({
  name: 'queryHistory',
  reducer: queryHistoryReducer,
  extraSelectors: ({ selectQueryHistoryState }) => ({
    ...queryHistoryAdapter.getSelectors(selectQueryHistoryState),
  }),
});
