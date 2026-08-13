import { NormalizedPoint } from '../normalized-point.model';
import { Polygon } from '../polygon.model';
import { toWorldPoint } from './to-world-point';

export function getWorldPoints(polygon: Polygon, aspectRatio: number): NormalizedPoint[] {
  return polygon.points.map((point) => toWorldPoint(point, polygon, aspectRatio));
}
