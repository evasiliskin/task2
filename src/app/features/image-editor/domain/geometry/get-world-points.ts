import { NormalizedPoint } from '../normalized-point.model';
import { Polygon } from '../polygon.model';

export function toWorldPoints(
  points: readonly NormalizedPoint[],
  polygon: Polygon,
  aspectRatio: number,
): NormalizedPoint[] {
  const cos = Math.cos(polygon.rotationRadians);
  const sin = Math.sin(polygon.rotationRadians);

  return points.map((point) => {
    const x = point.x * polygon.scale;
    const y = point.y * polygon.scale;
    return {
      x: x * cos - (y * sin) / aspectRatio + polygon.position.x,
      y: x * aspectRatio * sin + y * cos + polygon.position.y,
    };
  });
}

export function getWorldPoints(polygon: Polygon, aspectRatio: number): NormalizedPoint[] {
  return toWorldPoints(polygon.points, polygon, aspectRatio);
}
