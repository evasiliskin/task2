import { NormalizedPoint } from '../normalized-point.model';
import { Polygon } from '../polygon.model';

export function toWorldPoints(
  points: readonly NormalizedPoint[],
  polygon: Polygon,
  aspectRatio: number,
): NormalizedPoint[] {
  const cos = Math.cos(polygon.rotationRadians);
  const sin = Math.sin(polygon.rotationRadians);

  return points.map((point) => ({
    x: point.x * cos - (point.y * sin) / aspectRatio + polygon.position.x,
    y: point.x * aspectRatio * sin + point.y * cos + polygon.position.y,
  }));
}

export function getWorldPoints(polygon: Polygon, aspectRatio: number): NormalizedPoint[] {
  return toWorldPoints(polygon.points, polygon, aspectRatio);
}
