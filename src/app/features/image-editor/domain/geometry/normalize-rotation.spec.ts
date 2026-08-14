import { normalizeRotation } from './normalize-rotation';

describe('normalizeRotation', () => {
  it('should leave an in-range angle untouched', () => {
    expect(normalizeRotation(Math.PI)).toBeCloseTo(Math.PI, 12);
  });

  it('should wrap a full turn to zero', () => {
    expect(normalizeRotation(Math.PI * 2)).toBeCloseTo(0, 12);
  });

  it('should wrap many turns', () => {
    expect(normalizeRotation(Math.PI * 8 + 1)).toBeCloseTo(1, 12);
  });

  it('should map a negative angle into the positive range', () => {
    expect(normalizeRotation(-Math.PI / 2)).toBeCloseTo((3 * Math.PI) / 2, 12);
  });
});
