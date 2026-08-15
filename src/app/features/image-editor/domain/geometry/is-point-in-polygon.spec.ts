import { createPolygonFromPoints } from './create-polygon-from-points';
import { getWorldPoints } from './get-world-points';
import { isPointInPolygon } from './is-point-in-polygon';

describe('isPointInPolygon', () => {
  const square = [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 4, y: 4 },
    { x: 0, y: 4 },
  ];

  it('should return true, when the point is inside the polygon', () => {
    expect(isPointInPolygon({ x: 2, y: 2 }, square)).toBe(true);
  });

  it('should return false, when the point is outside the polygon', () => {
    expect(isPointInPolygon({ x: 5, y: 5 }, square)).toBe(false);
  });

  it('should return false, when the point is far to the left of the polygon', () => {
    expect(isPointInPolygon({ x: -1, y: 2 }, square)).toBe(false);
  });

  it('should return true, when the point is inside an irregular triangle', () => {
    const triangle = [
      { x: 0, y: 0 },
      { x: 6, y: 0 },
      { x: 3, y: 6 },
    ];

    expect(isPointInPolygon({ x: 3, y: 2 }, triangle)).toBe(true);
  });

  it("should hit-test correctly against a real polygon's world points, when composed with createPolygonFromPoints and getWorldPoints", () => {
    const polygon = createPolygonFromPoints(
      [
        { x: 0.4, y: 0.4 },
        { x: 0.6, y: 0.4 },
        { x: 0.6, y: 0.6 },
        { x: 0.4, y: 0.6 },
      ],
      'image-1',
      'polygon-1',
      0,
    );
    const worldPoints = getWorldPoints(polygon, 1);

    expect(isPointInPolygon({ x: 0.5, y: 0.5 }, worldPoints)).toBe(true);
    expect(isPointInPolygon({ x: 0.1, y: 0.1 }, worldPoints)).toBe(false);
  });
});
