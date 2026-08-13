import { toNormalizedPoint } from './to-normalized-point';

describe('toNormalizedPoint', () => {
  it('should scale a pixel point down to normalized space, when converting from pixel space', () => {
    expect(toNormalizedPoint({ x: 200, y: 50 }, { width: 400, height: 200 })).toEqual({
      x: 0.5,
      y: 0.25,
    });
  });

  it('should throw an error, when the box width is not positive', () => {
    expect(() => toNormalizedPoint({ x: 200, y: 50 }, { width: 0, height: 200 })).toThrow(
      'toNormalizedPoint requires a positive CanvasBoxSize width and height',
    );
  });

  it('should throw an error, when the box height is not positive', () => {
    expect(() => toNormalizedPoint({ x: 200, y: 50 }, { width: 400, height: 0 })).toThrow(
      'toNormalizedPoint requires a positive CanvasBoxSize width and height',
    );
  });
});
