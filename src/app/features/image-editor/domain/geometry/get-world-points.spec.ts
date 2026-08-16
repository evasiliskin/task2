import { Polygon } from '../polygon.model';
import { getWorldPoints, toWorldPoints } from './get-world-points';
import { toWorldPoint } from './to-world-point';

const IMAGE_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const POLYGON_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';

describe('getWorldPoints', () => {
  it('should return points offset by position, when rotation is zero', () => {
    const polygon: Polygon = {
      id: POLYGON_ID,
      imageId: IMAGE_ID,
      points: [
        { x: -1, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
      ],
      position: { x: 5, y: 5 },
      rotationRadians: 0,
      scale: 1,
      createdAt: 0,
    };

    expect(getWorldPoints(polygon, 1)).toEqual([
      { x: 4, y: 5 },
      { x: 6, y: 5 },
      { x: 5, y: 6 },
    ]);
  });

  it('should rotate points around the position, when rotation is non-zero', () => {
    const polygon: Polygon = {
      id: POLYGON_ID,
      imageId: IMAGE_ID,
      points: [{ x: 1, y: 0 }],
      position: { x: 5, y: 5 },
      rotationRadians: Math.PI / 2,
      scale: 1,
      createdAt: 0,
    };

    const [result] = getWorldPoints(polygon, 1);

    expect(result.x).toBeCloseTo(5, 9);
    expect(result.y).toBeCloseTo(6, 9);
  });

  it('should apply the aspect correction across all points, when aspect ratio is not 1', () => {
    const polygon: Polygon = {
      id: POLYGON_ID,
      imageId: IMAGE_ID,
      points: [{ x: 1, y: 0 }],
      position: { x: 5, y: 5 },
      rotationRadians: Math.PI / 2,
      scale: 1,
      createdAt: 0,
    };

    const [result] = getWorldPoints(polygon, 2);

    expect(result.x).toBeCloseTo(5, 9);
    expect(result.y).toBeCloseTo(7, 9);
  });

  it('should match per-point conversion, when a rotated polygon is converted in bulk', () => {
    const polygon: Polygon = {
      id: IMAGE_ID,
      imageId: IMAGE_ID,
      points: [
        { x: -0.1, y: -0.1 },
        { x: 0.1, y: -0.1 },
        { x: 0, y: 0.1 },
      ],
      position: { x: 0.5, y: 0.5 },
      rotationRadians: Math.PI / 3,
      scale: 1,
      createdAt: 0,
    };

    expect(toWorldPoints(polygon.points, polygon, 1.5)).toEqual(
      polygon.points.map((point) => toWorldPoint(point, polygon, 1.5)),
    );
  });
});

describe('getWorldPoints with scale', () => {
  it('should place vertices twice as far from the centroid, when scale is 2 and rotation is 0', () => {
    const polygon = {
      id: POLYGON_ID,
      imageId: IMAGE_ID,
      points: [
        { x: -0.1, y: -0.1 },
        { x: 0.1, y: -0.1 },
        { x: 0, y: 0.1 },
      ],
      position: { x: 0.5, y: 0.5 },
      rotationRadians: 0,
      scale: 2,
      createdAt: 0,
    };

    expect(getWorldPoints(polygon, 1)).toEqual([
      { x: 0.3, y: 0.3 },
      { x: 0.7, y: 0.3 },
      { x: 0.5, y: 0.7 },
    ]);
  });

  it('should keep the centroid fixed, when the scale changes', () => {
    const base = {
      id: POLYGON_ID,
      imageId: IMAGE_ID,
      points: [
        { x: -0.1, y: -0.1 },
        { x: 0.1, y: -0.1 },
        { x: 0, y: 0.2 },
      ],
      position: { x: 0.4, y: 0.6 },
      rotationRadians: Math.PI / 3,
      scale: 1,
      createdAt: 0,
    };

    const centroidOf = (points: readonly { x: number; y: number }[]) => ({
      x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
      y: points.reduce((sum, p) => sum + p.y, 0) / points.length,
    });

    const atOne = centroidOf(getWorldPoints(base, 1.75));
    const atThree = centroidOf(getWorldPoints({ ...base, scale: 3 }, 1.75));

    expect(atThree.x).toBeCloseTo(atOne.x, 10);
    expect(atThree.y).toBeCloseTo(atOne.y, 10);
  });
});

describe('cross-check with toWorldPoint', () => {
  it('should agree with toWorldPoint for every vertex, when the polygon is rotated and scaled', () => {
    const polygon: Polygon = {
      id: POLYGON_ID,
      imageId: IMAGE_ID,
      points: [
        { x: -0.1, y: -0.1 },
        { x: 0.1, y: -0.1 },
        { x: 0, y: 0.15 },
      ],
      position: { x: 0.5, y: 0.5 },
      rotationRadians: Math.PI / 7,
      scale: 1.4,
      createdAt: 0,
    };
    const aspectRatio = 16 / 9;

    expect(getWorldPoints(polygon, aspectRatio)).toEqual(
      polygon.points.map((point) => toWorldPoint(point, polygon, aspectRatio)),
    );
  });
});

describe('ratio preservation', () => {
  it('should scale pixel geometry proportionally, when the canvas box grows uniformly', () => {
    const polygon = {
      id: POLYGON_ID,
      imageId: IMAGE_ID,
      points: [
        { x: -0.1, y: -0.05 },
        { x: 0.1, y: -0.05 },
        { x: 0, y: 0.12 },
      ],
      position: { x: 0.4, y: 0.55 },
      rotationRadians: Math.PI / 5,
      scale: 1.6,
      createdAt: 0,
    };
    const aspectRatio = 16 / 9;

    const small = getWorldPoints(polygon, aspectRatio).map((point) => ({
      x: point.x * 320,
      y: point.y * 180,
    }));
    const large = getWorldPoints(polygon, aspectRatio).map((point) => ({
      x: point.x * 960,
      y: point.y * 540,
    }));

    large.forEach((point, index) => {
      expect(point.x).toBeCloseTo(small[index].x * 3, 8);
      expect(point.y).toBeCloseTo(small[index].y * 3, 8);
    });
  });
});
