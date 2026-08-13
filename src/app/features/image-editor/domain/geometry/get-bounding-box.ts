import { NormalizedPoint } from '../normalized-point.model';
import { BoundingBox } from './bounding-box.model';

export function getBoundingBox(points: readonly NormalizedPoint[]): BoundingBox {
  if (points.length === 0) {
    throw new Error('getBoundingBox requires at least one point');
  }

  return points.reduce<BoundingBox>(
    (box, point) => ({
      minX: Math.min(box.minX, point.x),
      minY: Math.min(box.minY, point.y),
      maxX: Math.max(box.maxX, point.x),
      maxY: Math.max(box.maxY, point.y),
    }),
    { minX: points[0].x, minY: points[0].y, maxX: points[0].x, maxY: points[0].y },
  );
}
