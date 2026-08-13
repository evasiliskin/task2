import { normalizeSearchQuery } from './normalize-search-query';

describe('normalizeSearchQuery', () => {
  const cases: Array<[string, string]> = [
    ['  cats  ', 'cats'],
    ['cats   and   dogs', 'cats and dogs'],
    ['', ''],
    ['   ', ''],
    ['already normal', 'already normal'],
  ];

  it.each(cases)('normalizes %j to %j', (input, expected) => {
    expect(normalizeSearchQuery(input)).toBe(expected);
  });
});
