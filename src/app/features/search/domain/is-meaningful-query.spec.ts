import { isMeaningfulQuery, MIN_MEANINGFUL_QUERY_LENGTH } from './is-meaningful-query';

describe('isMeaningfulQuery', () => {
  it('rejects an empty string', () => {
    expect(isMeaningfulQuery('')).toBe(false);
  });

  it(`rejects strings shorter than ${MIN_MEANINGFUL_QUERY_LENGTH} characters`, () => {
    expect(isMeaningfulQuery('a')).toBe(false);
  });

  it(`accepts strings at least ${MIN_MEANINGFUL_QUERY_LENGTH} characters long`, () => {
    expect(isMeaningfulQuery('ab')).toBe(true);
    expect(isMeaningfulQuery('cats')).toBe(true);
  });
});
