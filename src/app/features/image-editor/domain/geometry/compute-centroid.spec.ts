import { computeCentroid } from './compute-centroid';

describe('computeCentroid', () => {
  it('should return the point itself, when given a single point', () => {
    expect(computeCentroid([{ x: 3, y: 5 }])).toEqual({ x: 3, y: 5 });
  });

  it('should average two points, when given two points', () => {
    expect(
      computeCentroid([
        { x: 0, y: 0 },
        { x: 2, y: 2 },
      ]),
    ).toEqual({ x: 1, y: 1 });
  });

  it('should average all vertices, when given a triangle', () => {
    const triangle = [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 2, y: 3 },
    ];
    expect(computeCentroid(triangle)).toEqual({ x: 2, y: 1 });
  });

  it('should throw an error, when given an empty array', () => {
    expect(() => computeCentroid([])).toThrow('computeCentroid requires at least one point');
  });

  it('should return the vertex mean rather than the area centroid, when the polygon is irregular', () => {
    // An L-shaped polygon whose vertex mean and area centroid differ measurably.
    const points = [
      { x: 0, y: 0 },
      { x: 3, y: 0 },
      { x: 3, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 3 },
      { x: 0, y: 3 },
    ];

    expect(computeCentroid(points)).toEqual({ x: 8 / 6, y: 8 / 6 });
  });
});
