import { QueryHistoryActions } from './query-history.actions';

describe('query history actions', () => {
  it('should create a Query Recorded action carrying the query and timestamp, when queryRecorded is dispatched', () => {
    const action = QueryHistoryActions.queryRecorded({ query: 'mountains', usedAt: 1700000000000 });

    expect(action.type).toBe('[Query History] Query Recorded');
    expect(action.query).toBe('mountains');
    expect(action.usedAt).toBe(1700000000000);
  });
});
