import { NormalizedPoint } from '../normalized-point.model';
import { Polygon } from '../polygon.model';
import { addPoints, rotatePointAspectCorrected } from './point-math';

export function toWorldPoint(
  localPoint: NormalizedPoint,
  polygon: Polygon,
  aspectRatio: number,
): NormalizedPoint {
  return addPoints(
    rotatePointAspectCorrected(localPoint, polygon.rotationRadians, aspectRatio),
    polygon.position,
  );
}
