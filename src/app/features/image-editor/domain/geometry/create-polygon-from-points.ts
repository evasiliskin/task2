import { appConfig } from '@core/config/app-config';
import { NormalizedPoint } from '../normalized-point.model';
import { Polygon } from '../polygon.model';
import { computeCentroid } from './compute-centroid';
import { subtractPoints } from './point-math';

const { minPoints } = appConfig.imageEditor.polygon;

export function createPolygonFromPoints(
  rawPoints: readonly NormalizedPoint[],
  imageId: string,
  id: string,
  createdAt: number,
): Polygon {
  if (rawPoints.length < minPoints) {
    throw new Error(`createPolygonFromPoints requires at least ${minPoints} points`);
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
