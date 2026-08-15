import { Polygon } from '../polygon.model';
import { toWorldPoint } from './to-world-point';

describe('toWorldPoint', () => {
  it('should return the point offset by position, when rotation is zero', () => {
    const polygon: Polygon = {
      id: 'polygon-1',
      imageId: 'image-1',
      points: [{ x: -1, y: 0 }],
      position: { x: 5, y: 5 },
      rotationRadians: 0,
      scale: 1,
      createdAt: 0,
    };

    expect(toWorldPoint(polygon.points[0], polygon, 1)).toEqual({ x: 4, y: 5 });
  });

  it('should rotate the point rigidly when aspect ratio is 1, when rotation is non-zero', () => {
    const polygon: Polygon = {
      id: 'polygon-1',
      imageId: 'image-1',
      points: [{ x: 1, y: 0 }],
      position: { x: 5, y: 5 },
      rotationRadians: Math.PI / 2,
      scale: 1,
      createdAt: 0,
    };

    const result = toWorldPoint(polygon.points[0], polygon, 1);

    expect(result.x).toBeCloseTo(5, 9);
    expect(result.y).toBeCloseTo(6, 9);
  });

  it('should apply the aspect correction, when aspect ratio is not 1', () => {
    const polygon: Polygon = {
      id: 'polygon-1',
      imageId: 'image-1',
      points: [{ x: 1, y: 0 }],
      position: { x: 5, y: 5 },
      rotationRadians: Math.PI / 2,
      scale: 1,
      createdAt: 0,
    };

    const result = toWorldPoint(polygon.points[0], polygon, 2);

    expect(result.x).toBeCloseTo(5, 9);
    expect(result.y).toBeCloseTo(7, 9);
  });
});
