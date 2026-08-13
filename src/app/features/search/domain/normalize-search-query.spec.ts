import { normalizeSearchQuery } from './normalize-search-query';

describe('normalizeSearchQuery', () => {
  const cases: [string, string][] = [
    ['  cats  ', 'cats'],
    ['cats   and   dogs', 'cats and dogs'],
    ['', ''],
    ['   ', ''],
    ['already normal', 'already normal'],
  ];

  it.each(cases)('should normalize %j to %j, when given as input', (input, expected) => {
    expect(normalizeSearchQuery(input)).toBe(expected);
  });
});
