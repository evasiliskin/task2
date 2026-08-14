import { NormalizedPoint } from '../normalized-point.model';
import { Polygon } from '../polygon.model';
import { getBoundingBox } from './get-bounding-box';
import { toWorldPoint } from './to-world-point';

export const ROTATION_HANDLE_OFFSET_NORMALIZED = 0.1;

export function getRotationHandlePoint(polygon: Polygon, aspectRatio: number): NormalizedPoint {
  const boundingBox = getBoundingBox(polygon.points);

  const localHandlePoint: NormalizedPoint = {
    x: (boundingBox.minX + boundingBox.maxX) / 2,
    y: boundingBox.minY - ROTATION_HANDLE_OFFSET_NORMALIZED,
  };

  return toWorldPoint(localHandlePoint, polygon, aspectRatio);
}
