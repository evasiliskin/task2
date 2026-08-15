import { NormalizedPoint } from '../normalized-point.model';
import { Polygon } from '../polygon.model';
import { applyAspectRotation, createAspectRotation, scalePoint } from './point-math';

export function toWorldPoints(
  points: readonly NormalizedPoint[],
  polygon: Polygon,
  aspectRatio: number,
): NormalizedPoint[] {
  const rotation = createAspectRotation(polygon.rotationRadians, aspectRatio);

  return points.map((point) => {
    const rotated = applyAspectRotation(scalePoint(point, polygon.scale), rotation);
    return { x: rotated.x + polygon.position.x, y: rotated.y + polygon.position.y };
  });
}

export function getWorldPoints(polygon: Polygon, aspectRatio: number): NormalizedPoint[] {
  return toWorldPoints(polygon.points, polygon, aspectRatio);
}
