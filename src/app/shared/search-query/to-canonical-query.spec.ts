import { toCanonicalQuery } from './to-canonical-query';

describe('toCanonicalQuery', () => {
  it('should trim, collapse whitespace and lowercase, when the query is padded and mixed case', () => {
    expect(toCanonicalQuery('  Mountain   LAKE  ')).toBe('mountain lake');
  });

  it('should return the same result, when it is applied to an already canonical query', () => {
    expect(toCanonicalQuery(toCanonicalQuery('  Cats '))).toBe('cats');
  });

  it('should produce one key, when two queries differ only in casing', () => {
    expect(toCanonicalQuery('Cat')).toBe(toCanonicalQuery('cat'));
  });
});
