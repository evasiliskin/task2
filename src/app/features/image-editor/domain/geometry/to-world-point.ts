import { NormalizedPoint } from '../normalized-point.model';
import { Polygon } from '../polygon.model';
import { addPoints, rotatePointAspectCorrected, scalePoint } from './point-math';

export function toWorldPoint(
  localPoint: NormalizedPoint,
  polygon: Polygon,
  aspectRatio: number,
): NormalizedPoint {
  return addPoints(
    rotatePointAspectCorrected(
      scalePoint(localPoint, polygon.scale),
      polygon.rotationRadians,
      aspectRatio,
    ),
    polygon.position,
  );
}
