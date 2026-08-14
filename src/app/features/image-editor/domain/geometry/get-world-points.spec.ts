import { Polygon } from '../polygon.model';
import { getWorldPoints, toWorldPoints } from './get-world-points';
import { toWorldPoint } from './to-world-point';

describe('getWorldPoints', () => {
  it('should return points offset by position, when rotation is zero', () => {
    const polygon: Polygon = {
      id: 'polygon-1',
      imageId: 'image-1',
      points: [
        { x: -1, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
      ],
      position: { x: 5, y: 5 },
      rotationRadians: 0,
    };

    expect(getWorldPoints(polygon, 1)).toEqual([
      { x: 4, y: 5 },
      { x: 6, y: 5 },
      { x: 5, y: 6 },
    ]);
  });

  it('should rotate points around the position, when rotation is non-zero', () => {
    const polygon: Polygon = {
      id: 'polygon-1',
      imageId: 'image-1',
      points: [{ x: 1, y: 0 }],
      position: { x: 5, y: 5 },
      rotationRadians: Math.PI / 2,
    };

    const [result] = getWorldPoints(polygon, 1);

    expect(result.x).toBeCloseTo(5, 9);
    expect(result.y).toBeCloseTo(6, 9);
  });

  it('should apply the aspect correction across all points, when aspect ratio is not 1', () => {
    const polygon: Polygon = {
      id: 'polygon-1',
      imageId: 'image-1',
      points: [{ x: 1, y: 0 }],
      position: { x: 5, y: 5 },
      rotationRadians: Math.PI / 2,
    };

    const [result] = getWorldPoints(polygon, 2);

    expect(result.x).toBeCloseTo(5, 9);
    expect(result.y).toBeCloseTo(7, 9);
  });

  it('should match per-point conversion, when a rotated polygon is converted in bulk', () => {
    const polygon: Polygon = {
      id: 'image-1',
      imageId: 'image-1',
      points: [
        { x: -0.1, y: -0.1 },
        { x: 0.1, y: -0.1 },
        { x: 0, y: 0.1 },
      ],
      position: { x: 0.5, y: 0.5 },
      rotationRadians: Math.PI / 3,
    };

    expect(toWorldPoints(polygon.points, polygon, 1.5)).toEqual(
      polygon.points.map((point) => toWorldPoint(point, polygon, 1.5)),
    );
  });
});
