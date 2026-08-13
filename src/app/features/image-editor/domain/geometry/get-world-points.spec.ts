import { Polygon } from '../polygon.model';
import { getWorldPoints } from './get-world-points';

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
});
