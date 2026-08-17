import { normalizeRotation } from './normalize-rotation';

describe('normalizeRotation', () => {
  it('should return the angle unchanged, when it is already within one turn', () => {
    expect(normalizeRotation(Math.PI)).toBeCloseTo(Math.PI, 12);
  });

  it('should return zero, when the angle is a full turn', () => {
    expect(normalizeRotation(Math.PI * 2)).toBeCloseTo(0, 12);
  });

  it('should wrap into one turn, when the angle spans several turns', () => {
    expect(normalizeRotation(Math.PI * 8 + 1)).toBeCloseTo(1, 12);
  });

  it('should map into the positive range, when the angle is negative', () => {
    expect(normalizeRotation(-Math.PI / 2)).toBeCloseTo((3 * Math.PI) / 2, 12);
  });
});
