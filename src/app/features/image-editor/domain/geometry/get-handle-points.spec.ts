import { describe, expect, it } from 'vitest';
import {
  getRotationHandlePixel,
  getScaleHandlePixels,
  ROTATION_HANDLE_OFFSET_PX,
} from './get-handle-points';
import { Polygon } from '../polygon.model';

const IMAGE_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

const POLYGON_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';

const BOX = { width: 400, height: 400 };

function polygonAt(y: number, rotationRadians = 0, scale = 1): Polygon {
  return {
    id: POLYGON_ID,
    imageId: IMAGE_ID,
    points: [
      { x: -0.1, y: -0.1 },
      { x: 0.1, y: -0.1 },
      { x: 0.1, y: 0.1 },
      { x: -0.1, y: 0.1 },
    ],
    position: { x: 0.5, y },
    rotationRadians,
    scale,
    createdAt: 0,
  };
}

describe('getRotationHandlePixel', () => {
  it('should sit the offset above the shape, when the polygon is mid-image and unrotated', () => {
    const handle = getRotationHandlePixel(polygonAt(0.5), BOX);

    expect(handle.x).toBeCloseTo(200, 6);
    expect(handle.y).toBeCloseTo(160 - ROTATION_HANDLE_OFFSET_PX, 6);
  });

  it('should stay inside the canvas, when the polygon is against the top edge', () => {
    const handle = getRotationHandlePixel(polygonAt(0.02), BOX);

    expect(handle.y).toBeGreaterThanOrEqual(0);
    expect(handle.y).toBeLessThanOrEqual(BOX.height);
  });

  it('should rotate with the shape, when the polygon is rotated a quarter turn', () => {
    const handle = getRotationHandlePixel(polygonAt(0.5, Math.PI / 2), BOX);

    expect(handle.x).toBeCloseTo(200 + 40 + ROTATION_HANDLE_OFFSET_PX, 6);
    expect(handle.y).toBeCloseTo(200, 6);
  });

  it('should place the handle below the shape, when the polygon sits against the top edge', () => {
    const polygon: Polygon = {
      id: POLYGON_ID,
      imageId: IMAGE_ID,
      points: [
        { x: -0.1, y: -0.05 },
        { x: 0.1, y: -0.05 },
        { x: 0, y: 0.05 },
      ],
      position: { x: 0.5, y: 0.01 },
      rotationRadians: 0,
      scale: 1,
      createdAt: 0,
    };
    const boxSize = { width: 400, height: 400 };

    const handle = getRotationHandlePixel(polygon, boxSize);
    const bodyBottomPx = (0.01 + 0.05) * 400;

    expect(handle.y).toBeGreaterThan(bodyBottomPx);
    expect(handle.y).toBeLessThanOrEqual(boxSize.height);
  });
});

describe('getScaleHandlePixels', () => {
  it('should return four corners, when the polygon is unrotated', () => {
    expect(getScaleHandlePixels(polygonAt(0.5), BOX)).toEqual([
      { x: 160, y: 160 },
      { x: 240, y: 160 },
      { x: 240, y: 240 },
      { x: 160, y: 240 },
    ]);
  });

  it('should move the corners outward, when the scale doubles', () => {
    const corners = getScaleHandlePixels(polygonAt(0.5, 0, 2), BOX);

    expect(corners[0]).toEqual({ x: 120, y: 120 });
    expect(corners[2]).toEqual({ x: 280, y: 280 });
  });
});
