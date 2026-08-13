import { createPolygonFromPoints } from './create-polygon-from-points';

describe('createPolygonFromPoints', () => {
  it('should center the local points on the centroid, when given a valid triangle', () => {
    const rawPoints = [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 2, y: 3 },
    ];

    const polygon = createPolygonFromPoints(rawPoints, 'image-1');

    expect(polygon).toEqual({
      id: 'image-1',
      imageId: 'image-1',
      points: [
        { x: -2, y: -1 },
        { x: 2, y: -1 },
        { x: 0, y: 2 },
      ],
      position: { x: 2, y: 1 },
      rotationRadians: 0,
    });
  });

  it('should throw an error, when given fewer than three points', () => {
    const rawPoints = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ];

    expect(() => createPolygonFromPoints(rawPoints, 'image-1')).toThrow(
      'createPolygonFromPoints requires at least 3 points',
    );
  });
});
