import { toNormalizedPoint } from './to-normalized-point';
import { toPixelPoint } from './to-pixel-point';

describe('toPixelPoint', () => {
  it('should scale a normalized point by the box size, when converting to pixel space', () => {
    expect(toPixelPoint({ x: 0.5, y: 0.25 }, { width: 400, height: 200 })).toEqual({
      x: 200,
      y: 50,
    });
  });

  it('should throw an error, when the box width is not positive', () => {
    expect(() => toPixelPoint({ x: 0.5, y: 0.5 }, { width: 0, height: 200 })).toThrow(
      'toPixelPoint requires a positive CanvasBoxSize width and height',
    );
  });

  it('should throw an error, when the box height is not positive', () => {
    expect(() => toPixelPoint({ x: 0.5, y: 0.5 }, { width: 400, height: -10 })).toThrow(
      'toPixelPoint requires a positive CanvasBoxSize width and height',
    );
  });

  it('should round-trip back to the original point, when composed with toNormalizedPoint', () => {
    const original = { x: 0.37, y: 0.82 };
    const boxSize = { width: 400, height: 250 };

    const roundTripped = toNormalizedPoint(toPixelPoint(original, boxSize), boxSize);

    expect(roundTripped.x).toBeCloseTo(original.x, 9);
    expect(roundTripped.y).toBeCloseTo(original.y, 9);
  });
});
