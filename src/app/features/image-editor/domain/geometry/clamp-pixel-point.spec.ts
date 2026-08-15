import { describe, expect, it } from 'vitest';
import { clampPixelPointIntoBox } from './clamp-pixel-point';

describe('clampPixelPointIntoBox', () => {
  it('should return the point unchanged, when it is already inside the inset box', () => {
    expect(clampPixelPointIntoBox({ x: 50, y: 60 }, { width: 200, height: 100 }, 6)).toEqual({
      x: 50,
      y: 60,
    });
  });

  it('should pull the point to the inset, when it is above the top edge', () => {
    expect(clampPixelPointIntoBox({ x: 50, y: -40 }, { width: 200, height: 100 }, 6)).toEqual({
      x: 50,
      y: 6,
    });
  });

  it('should stay inside the box, when the box is smaller than twice the inset', () => {
    const clamped = clampPixelPointIntoBox({ x: -10, y: -10 }, { width: 8, height: 8 }, 6);

    expect(clamped.x).toBeGreaterThanOrEqual(0);
    expect(clamped.x).toBeLessThanOrEqual(8);
  });
});
