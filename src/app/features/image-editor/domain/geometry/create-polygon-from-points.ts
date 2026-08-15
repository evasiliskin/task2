import { NormalizedPoint } from '../normalized-point.model';
import { Polygon } from '../polygon.model';
import { computeCentroid } from './compute-centroid';
import { subtractPoints } from './point-math';

export const MIN_POLYGON_POINTS = 3;

export function createPolygonFromPoints(
  rawPoints: readonly NormalizedPoint[],
  imageId: string,
  id: string,
  createdAt: number,
): Polygon {
  if (rawPoints.length < MIN_POLYGON_POINTS) {
    throw new Error(`createPolygonFromPoints requires at least ${MIN_POLYGON_POINTS} points`);
  }

  const centroid = computeCentroid(rawPoints);

  return {
    id,
    imageId,
    points: rawPoints.map((point) => subtractPoints(point, centroid)),
    position: centroid,
    rotationRadians: 0,
    scale: 1,
    createdAt,
  };
}
