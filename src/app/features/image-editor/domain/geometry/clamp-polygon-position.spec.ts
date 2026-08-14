import { clampPolygonPosition } from './clamp-polygon-position';

describe('clampPolygonPosition', () => {
  it('should leave an in-range position untouched', () => {
    expect(clampPolygonPosition({ x: 0.4, y: 0.6 })).toEqual({ x: 0.4, y: 0.6 });
  });

  it('should clamp a position below the image', () => {
    expect(clampPolygonPosition({ x: -0.5, y: -2 })).toEqual({ x: 0, y: 0 });
  });

  it('should clamp a position beyond the image', () => {
    expect(clampPolygonPosition({ x: 1.5, y: 3 })).toEqual({ x: 1, y: 1 });
  });

  it('should clamp each axis independently', () => {
    expect(clampPolygonPosition({ x: -0.2, y: 0.5 })).toEqual({ x: 0, y: 0.5 });
  });

  it('should keep the exact bounds', () => {
    expect(clampPolygonPosition({ x: 0, y: 1 })).toEqual({ x: 0, y: 1 });
  });
});
