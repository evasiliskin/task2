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

  it('should return an empty array, when the input is blank', () => {
    expect(suggestionsFor('   ', history)).toEqual([]);
  });

  it('should match history entries containing a word starting with the input, when a partial word is typed', () => {
    expect(suggestionsFor('angular', history)).toEqual([
      'angular architecture',
      'angular testing',
      'angular ngrx',
    ]);
  });

  it('should exclude an entry identical to the normalized input, when the input matches an entry exactly', () => {
    expect(suggestionsFor('angular architecture', history)).not.toContain('angular architecture');
  });

  it('should match case-insensitively, when the input differs in case from history entries', () => {
    expect(suggestionsFor('ANGULAR', history)).toEqual([
      'angular architecture',
      'angular testing',
      'angular ngrx',
    ]);
  });

  it('should order matches by most recently used first, when multiple entries match', () => {
    const unordered = [entry('angular one', 1), entry('angular two', 5), entry('angular three', 3)];
    expect(suggestionsFor('angular', unordered)).toEqual([
      'angular two',
      'angular three',
      'angular one',
    ]);
  });

  it('should respect the limit parameter, when more matches exist than the limit', () => {
    expect(suggestionsFor('angular', history, 2)).toEqual([
      'angular architecture',
      'angular testing',
    ]);
  });

  it('should narrow matches, when multiple words are typed', () => {
    expect(suggestionsFor('angular arch', history)).toEqual(['angular architecture']);
  });
});
