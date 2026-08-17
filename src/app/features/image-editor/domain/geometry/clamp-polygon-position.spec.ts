import { clampPolygonPosition } from './clamp-polygon-position';

describe('clampPolygonPosition', () => {
  it('should return the position unchanged, when it is inside the image', () => {
    expect(clampPolygonPosition({ x: 0.4, y: 0.6 })).toEqual({ x: 0.4, y: 0.6 });
  });

  it('should clamp to the origin, when the position is below the image', () => {
    expect(clampPolygonPosition({ x: -0.5, y: -2 })).toEqual({ x: 0, y: 0 });
  });

  it('should clamp to the far corner, when the position is beyond the image', () => {
    expect(clampPolygonPosition({ x: 1.5, y: 3 })).toEqual({ x: 1, y: 1 });
  });

  it('should clamp only the offending axis, when a single axis is out of range', () => {
    expect(clampPolygonPosition({ x: -0.2, y: 0.5 })).toEqual({ x: 0, y: 0.5 });
  });

  it('should return the position unchanged, when it sits exactly on the bounds', () => {
    expect(clampPolygonPosition({ x: 0, y: 1 })).toEqual({ x: 0, y: 1 });
  });
});
