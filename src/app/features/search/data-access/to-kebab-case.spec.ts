import { toKebabCase } from './to-kebab-case';

describe('toKebabCase', () => {
  const cases: [string, string][] = [
    ['cats', 'cats'],
    ['  cats  ', 'cats'],
    ['cats and dogs', 'cats-and-dogs'],
    ['cats   and   dogs', 'cats-and-dogs'],
    ['cats, and dogs!', 'cats-and-dogs'],
    ['cat-dog', 'cat-dog'],
    ['--cats--', 'cats'],
    ['CATS', 'cats'],
    ['', ''],
    ['   ', ''],
  ];

  it.each(cases)('should convert %j to %j, when building a cache-key prefix', (input, expected) => {
    expect(toKebabCase(input)).toBe(expected);
  });
});
