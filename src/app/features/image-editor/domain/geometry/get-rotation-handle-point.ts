import { NormalizedPoint } from '../normalized-point.model';
import { Polygon } from '../polygon.model';
import { getBoundingBox } from './get-bounding-box';
import { toWorldPoint } from './to-world-point';

// Normalized-space gap above the polygon's local bounding box, in image-relative units, not pixels.
export const ROTATION_HANDLE_OFFSET = 0.1;

export function getRotationHandlePoint(polygon: Polygon, aspectRatio: number): NormalizedPoint {
  const boundingBox = getBoundingBox(polygon.points);

  const localHandlePoint: NormalizedPoint = {
    x: (boundingBox.minX + boundingBox.maxX) / 2,
    y: boundingBox.minY - ROTATION_HANDLE_OFFSET,
  };

  return toWorldPoint(localHandlePoint, polygon, aspectRatio);
}
