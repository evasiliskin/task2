import { Polygon } from '../polygon.model';
import { clampPixelPointIntoBox } from './clamp-pixel-point';
import { CanvasBoxSize, PixelPoint } from './coordinate-mapping.model';
import { getBoundingBox } from './get-bounding-box';
import { toPixelPoint } from './to-pixel-point';
import { toWorldPoint } from './to-world-point';

export const ROTATION_HANDLE_OFFSET_PX = 28;
export const HANDLE_EDGE_INSET_PX = 6;
const HANDLE_FLIP_TOLERANCE_PX = 0.5;

export function getRotationHandlePixel(polygon: Polygon, boxSize: CanvasBoxSize): PixelPoint {
  const boundingBox = getBoundingBox(polygon.points);
  const aspectRatio = boxSize.width / boxSize.height;
  const up = { x: Math.sin(polygon.rotationRadians), y: -Math.cos(polygon.rotationRadians) };

  const topCentrePixel = toPixelPoint(
    toWorldPoint(
      { x: (boundingBox.minX + boundingBox.maxX) / 2, y: boundingBox.minY },
      polygon,
      aspectRatio,
    ),
    boxSize,
  );
  const bottomCentrePixel = toPixelPoint(
    toWorldPoint(
      { x: (boundingBox.minX + boundingBox.maxX) / 2, y: boundingBox.maxY },
      polygon,
      aspectRatio,
    ),
    boxSize,
  );

  const preferred = {
    x: topCentrePixel.x + up.x * ROTATION_HANDLE_OFFSET_PX,
    y: topCentrePixel.y + up.y * ROTATION_HANDLE_OFFSET_PX,
  };
  const clampedPreferred = clampPixelPointIntoBox(preferred, boxSize, HANDLE_EDGE_INSET_PX);

  if (
    Math.abs(clampedPreferred.x - preferred.x) <= HANDLE_FLIP_TOLERANCE_PX &&
    Math.abs(clampedPreferred.y - preferred.y) <= HANDLE_FLIP_TOLERANCE_PX
  ) {
    return clampedPreferred;
  }

  return clampPixelPointIntoBox(
    {
      x: bottomCentrePixel.x - up.x * ROTATION_HANDLE_OFFSET_PX,
      y: bottomCentrePixel.y - up.y * ROTATION_HANDLE_OFFSET_PX,
    },
    boxSize,
    HANDLE_EDGE_INSET_PX,
  );
}

export function getScaleHandlePixels(polygon: Polygon, boxSize: CanvasBoxSize): PixelPoint[] {
  const boundingBox = getBoundingBox(polygon.points);
  const aspectRatio = boxSize.width / boxSize.height;

  return [
    { x: boundingBox.minX, y: boundingBox.minY },
    { x: boundingBox.maxX, y: boundingBox.minY },
    { x: boundingBox.maxX, y: boundingBox.maxY },
    { x: boundingBox.minX, y: boundingBox.maxY },
  ].map((corner) => toPixelPoint(toWorldPoint(corner, polygon, aspectRatio), boxSize));
}
