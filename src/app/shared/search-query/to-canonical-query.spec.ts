import { toCanonicalQuery } from './to-canonical-query';

describe('toCanonicalQuery', () => {
  it('should trim, collapse whitespace, and lowercase', () => {
    expect(toCanonicalQuery('  Mountain   LAKE  ')).toBe('mountain lake');
  });

  it('should be idempotent', () => {
    expect(toCanonicalQuery(toCanonicalQuery('  Cats '))).toBe('cats');
  });

  it('should collapse casing variants onto one key', () => {
    expect(toCanonicalQuery('Cat')).toBe(toCanonicalQuery('cat'));
  });
});
