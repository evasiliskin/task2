import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { createFeature, createReducer, on } from '@ngrx/store';
import { QueryHistoryEntry } from '../domain/query-history-entry.model';
import { QueryHistoryActions } from './query-history.actions';

export type QueryHistoryState = EntityState<QueryHistoryEntry>;

export const queryHistoryAdapter = createEntityAdapter<QueryHistoryEntry>({
  selectId: (entry) => entry.query.toLowerCase(),
});

export const initialState: QueryHistoryState = queryHistoryAdapter.getInitialState();

const queryHistoryReducer = createReducer(
  initialState,
  on(QueryHistoryActions.queryRecorded, (state, { query, usedAt }) =>
    queryHistoryAdapter.upsertOne({ query, lastUsedAt: usedAt }, state),
  ),
);

const queryHistoryFeatureObj = createFeature({
  name: 'queryHistory',
  reducer: queryHistoryReducer,
  extraSelectors: ({ selectQueryHistoryState }) => ({
    ...queryHistoryAdapter.getSelectors(selectQueryHistoryState),
  }),
});

export const queryHistoryFeature = {
  initialState,
  ...queryHistoryFeatureObj,
  selectQueryHistoryEntries: queryHistoryFeatureObj.selectAll,
};

export const { selectQueryHistoryState } = queryHistoryFeature;
