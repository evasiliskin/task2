import { createPolygonFromPoints } from './create-polygon-from-points';

describe('createPolygonFromPoints', () => {
  it('should center the local points on the centroid, when given a valid triangle', () => {
    const rawPoints = [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 2, y: 3 },
    ];

    const polygon = createPolygonFromPoints(rawPoints, 'image-1', 'polygon-1');

    expect(polygon).toEqual({
      id: 'polygon-1',
      imageId: 'image-1',
      points: [
        { x: -2, y: -1 },
        { x: 2, y: -1 },
        { x: 0, y: 2 },
      ],
      position: { x: 2, y: 1 },
      rotationRadians: 0,
      scale: 1,
    });
  });

  it('should throw an error, when given fewer than three points', () => {
    const rawPoints = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ];

    expect(() => createPolygonFromPoints(rawPoints, 'image-1', 'polygon-1')).toThrow(
      'createPolygonFromPoints requires at least 3 points',
    );
  });

  it('should use the supplied id and leave imageId as the grouping key, when creating a polygon', () => {
    const polygon = createPolygonFromPoints(
      [
        { x: 0.2, y: 0.2 },
        { x: 0.4, y: 0.2 },
        { x: 0.3, y: 0.4 },
      ],
      'image-1',
      'polygon-7',
    );

    expect(polygon.id).toBe('polygon-7');
    expect(polygon.imageId).toBe('image-1');
    expect(polygon.scale).toBe(1);
  });
});
