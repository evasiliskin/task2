import { describe, expect, it } from 'vitest';
import { appConfig } from '@core/config/app-config';
import { clampPolygonScale } from './clamp-polygon-scale';

const { minScale, maxScale } = appConfig.imageEditor.polygon;

describe('clampPolygonScale', () => {
  it('should return the scale unchanged, when it is inside the bounds', () => {
    expect(clampPolygonScale(1.5)).toBe(1.5);
  });

  it('should clamp to the minimum, when the scale is below the lower bound', () => {
    expect(clampPolygonScale(0.001)).toBe(minScale);
  });

  it('should clamp to the maximum, when the scale is above the upper bound', () => {
    expect(clampPolygonScale(50)).toBe(maxScale);
  });
});
