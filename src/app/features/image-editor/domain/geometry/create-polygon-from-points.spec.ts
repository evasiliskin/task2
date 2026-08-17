import { createPolygonFromPoints } from './create-polygon-from-points';

const IMAGE_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const POLYGON_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';
const SECOND_POLYGON_ID = '6ba7b810-9dad-41d1-80b4-00c04fd430c8';

describe('createPolygonFromPoints', () => {
  it('should center the local points on the centroid, when given a valid triangle', () => {
    const rawPoints = [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 2, y: 3 },
    ];

    const polygon = createPolygonFromPoints(rawPoints, IMAGE_ID, POLYGON_ID, 0);

    expect(polygon).toEqual({
      id: POLYGON_ID,
      imageId: IMAGE_ID,
      points: [
        { x: -2, y: -1 },
        { x: 2, y: -1 },
        { x: 0, y: 2 },
      ],
      position: { x: 2, y: 1 },
      rotationRadians: 0,
      scale: 1,
      createdAt: 0,
    });
  });

  it('should throw an error, when given fewer than three points', () => {
    const rawPoints = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ];

    expect(() => createPolygonFromPoints(rawPoints, IMAGE_ID, POLYGON_ID, 0)).toThrow(
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
      IMAGE_ID,
      SECOND_POLYGON_ID,
      0,
    );

    expect(polygon.id).toBe(SECOND_POLYGON_ID);
    expect(polygon.imageId).toBe(IMAGE_ID);
    expect(polygon.scale).toBe(1);
  });
});
