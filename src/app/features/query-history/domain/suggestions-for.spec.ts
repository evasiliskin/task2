import { suggestionsFor } from './suggestions-for';
import { QueryHistoryEntry } from './query-history-entry.model';

function entry(query: string, lastUsedAt: number): QueryHistoryEntry {
  return { query, lastUsedAt };
}

describe('suggestionsFor', () => {
  const history: QueryHistoryEntry[] = [
    entry('angular architecture', 4),
    entry('angular testing', 3),
    entry('angular ngrx', 2),
    entry('react architecture', 1),
  ];

  it('returns an empty array for blank input', () => {
    expect(suggestionsFor('   ', history)).toEqual([]);
  });

  it('matches history entries containing a word starting with the input', () => {
    expect(suggestionsFor('angular', history)).toEqual([
      'angular architecture',
      'angular testing',
      'angular ngrx',
    ]);
  });

  it('excludes an entry identical to the normalized input', () => {
    expect(suggestionsFor('angular architecture', history)).not.toContain('angular architecture');
  });

  it('is case-insensitive', () => {
    expect(suggestionsFor('ANGULAR', history)).toEqual([
      'angular architecture',
      'angular testing',
      'angular ngrx',
    ]);
  });

  it('orders matches by most recently used first', () => {
    const unordered = [entry('angular one', 1), entry('angular two', 5), entry('angular three', 3)];
    expect(suggestionsFor('angular', unordered)).toEqual([
      'angular two',
      'angular three',
      'angular one',
    ]);
  });

  it('respects the limit parameter', () => {
    expect(suggestionsFor('angular', history, 2)).toEqual([
      'angular architecture',
      'angular testing',
    ]);
  });

  it('narrows matches when multiple words are typed', () => {
    expect(suggestionsFor('angular arch', history)).toEqual(['angular architecture']);
  });
});
