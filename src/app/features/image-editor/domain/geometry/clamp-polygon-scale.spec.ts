import { describe, expect, it } from 'vitest';
import { clampPolygonScale, MAX_POLYGON_SCALE, MIN_POLYGON_SCALE } from './clamp-polygon-scale';

describe('clampPolygonScale', () => {
  it('should return the scale unchanged, when it is inside the bounds', () => {
    expect(clampPolygonScale(1.5)).toBe(1.5);
  });

  it('should clamp to the minimum, when the scale is below the lower bound', () => {
    expect(clampPolygonScale(0.001)).toBe(MIN_POLYGON_SCALE);
  });

  it('should clamp to the maximum, when the scale is above the upper bound', () => {
    expect(clampPolygonScale(50)).toBe(MAX_POLYGON_SCALE);
  });
});
