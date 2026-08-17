import { NormalizedPoint } from '../normalized-point.model';

export function computeCentroid(points: readonly NormalizedPoint[]): NormalizedPoint {
  if (points.length === 0) {
    throw new Error('computeCentroid requires at least one point');
  }

  const sum = points.reduce((acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }), {
    x: 0,
    y: 0,
  });

  return { x: sum.x / points.length, y: sum.y / points.length };
}
