import { nextActiveIndex } from './suggestion-navigation';

describe('nextActiveIndex', () => {
  it('should activate the first option, when moving down from no selection', () => {
    expect(nextActiveIndex(-1, 3, 1)).toBe(0);
  });

  it('should activate the last option, when moving up from no selection', () => {
    expect(nextActiveIndex(-1, 3, -1)).toBe(2);
  });

  it('should wrap to the first option, when moving down from the last', () => {
    expect(nextActiveIndex(2, 3, 1)).toBe(0);
  });

  it('should wrap to the last option, when moving up from the first', () => {
    expect(nextActiveIndex(0, 3, -1)).toBe(2);
  });

  it('should report no selection, when the list is empty', () => {
    expect(nextActiveIndex(-1, 0, 1)).toBe(-1);
  });
});
