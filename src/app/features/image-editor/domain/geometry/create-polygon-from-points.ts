import { NormalizedPoint } from '../normalized-point.model';
import { Polygon } from '../polygon.model';
import { computeCentroid } from './compute-centroid';
import { subtractPoints } from './point-math';

export const MIN_POLYGON_POINTS = 3;

export function createPolygonFromPoints(
  rawPoints: readonly NormalizedPoint[],
  imageId: string,
): Polygon {
  if (rawPoints.length < MIN_POLYGON_POINTS) {
    throw new Error(`createPolygonFromPoints requires at least ${MIN_POLYGON_POINTS} points`);
  }

  const centroid = computeCentroid(rawPoints);
  const localPoints = rawPoints.map((point) => subtractPoints(point, centroid));

  return {
    id: imageId,
    imageId,
    points: localPoints,
    position: centroid,
    rotationRadians: 0,
  };
}
