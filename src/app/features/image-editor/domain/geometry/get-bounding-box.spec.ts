import { getBoundingBox } from './get-bounding-box';

describe('getBoundingBox', () => {
  it('should return the min/max extents, when given a set of points', () => {
    const points = [
      { x: -2, y: -1 },
      { x: 2, y: -1 },
      { x: 0, y: 2 },
    ];

    expect(getBoundingBox(points)).toEqual({ minX: -2, minY: -1, maxX: 2, maxY: 2 });
  });

  it('should collapse to a single point, when given one point', () => {
    expect(getBoundingBox([{ x: 3, y: 4 }])).toEqual({ minX: 3, minY: 4, maxX: 3, maxY: 4 });
  });

  it('should throw an error, when given an empty array', () => {
    expect(() => getBoundingBox([])).toThrow('getBoundingBox requires at least one point');
  });
});
