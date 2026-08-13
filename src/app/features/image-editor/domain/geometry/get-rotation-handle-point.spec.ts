import { NormalizedPoint } from '../normalized-point.model';
import { Polygon } from '../polygon.model';
import { getRotationHandlePoint } from './get-rotation-handle-point';

describe('getRotationHandlePoint', () => {
  const localSquare: NormalizedPoint[] = [
    { x: -0.1, y: -0.1 },
    { x: 0.1, y: -0.1 },
    { x: 0.1, y: 0.1 },
    { x: -0.1, y: 0.1 },
  ];

  it('should place the handle above the bounding box center, when rotation is zero', () => {
    const polygon: Polygon = {
      id: 'polygon-1',
      imageId: 'image-1',
      points: localSquare,
      position: { x: 0.5, y: 0.5 },
      rotationRadians: 0,
    };

    const handle = getRotationHandlePoint(polygon, 1);

    expect(handle.x).toBeCloseTo(0.5, 9);
    expect(handle.y).toBeCloseTo(0.3, 9);
  });

  it('should rotate the handle around the position, when rotation is non-zero', () => {
    const polygon: Polygon = {
      id: 'polygon-1',
      imageId: 'image-1',
      points: localSquare,
      position: { x: 0.5, y: 0.5 },
      rotationRadians: Math.PI / 2,
    };

    const handle = getRotationHandlePoint(polygon, 2);

    expect(handle.x).toBeCloseTo(0.6, 9);
    expect(handle.y).toBeCloseTo(0.5, 9);
  });

  it('should center the handle horizontally on an asymmetric bounding box, when the polygon is not symmetric about local x=0', () => {
    const asymmetricPoints: NormalizedPoint[] = [
      { x: -0.1, y: -0.05 },
      { x: 0.3, y: -0.05 },
      { x: 0.1, y: 0.05 },
    ];
    const polygon: Polygon = {
      id: 'polygon-1',
      imageId: 'image-1',
      points: asymmetricPoints,
      position: { x: 0, y: 0 },
      rotationRadians: 0,
    };

    const handle = getRotationHandlePoint(polygon, 1);

    expect(handle.x).toBeCloseTo(0.1, 9);
    expect(handle.y).toBeCloseTo(-0.15, 9);
  });
});
