import { appConfig } from '@core/config/app-config';
import { isMeaningfulQuery } from './is-meaningful-query';

const { minQueryLength } = appConfig.search;

describe('isMeaningfulQuery', () => {
  it('should reject an empty string, when the query is empty', () => {
    expect(isMeaningfulQuery('')).toBe(false);
  });

  it(`should reject the query, when it is shorter than ${minQueryLength} characters`, () => {
    expect(isMeaningfulQuery('a')).toBe(false);
  });

  it(`should accept the query, when it is at least ${minQueryLength} characters long`, () => {
    expect(isMeaningfulQuery('ab')).toBe(true);
    expect(isMeaningfulQuery('cats')).toBe(true);
  });

  it('should accept a single non-ASCII character, when a CJK query is typed', () => {
    expect(isMeaningfulQuery('猫')).toBe(true);
  });

  it('should still reject a single ASCII character, when one letter is typed', () => {
    expect(isMeaningfulQuery('a')).toBe(false);
  });
});
