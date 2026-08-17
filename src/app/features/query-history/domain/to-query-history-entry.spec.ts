import { toQueryHistoryEntry } from './to-query-history-entry';

describe('toQueryHistoryEntry', () => {
  it('should keep the raw query and add its canonical form and words, when an entry is built', () => {
    expect(toQueryHistoryEntry('  Snowy   Mountains ', 7)).toEqual({
      query: '  Snowy   Mountains ',
      canonicalQuery: 'snowy mountains',
      words: ['snowy', 'mountains'],
      lastUsedAt: 7,
    });
  });

  it('should produce no words, when the query is blank', () => {
    expect(toQueryHistoryEntry('   ', 1).words).toEqual([]);
  });
});
