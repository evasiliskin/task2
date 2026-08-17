import { appConfig } from '@core/config/app-config';
import { Polygon } from '../polygon.model';
import { clampPixelPointIntoBox } from './clamp-pixel-point';
import { CanvasBoxSize, PixelPoint } from './coordinate-mapping.model';
import { getBoundingBox } from './get-bounding-box';
import { toPixelPoint } from './to-pixel-point';
import { toWorldPoint } from './to-world-point';

const { rotationOffsetPx, edgeInsetPx, flipTolerancePx } = appConfig.imageEditor.handles;

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
    x: topCentrePixel.x + up.x * rotationOffsetPx,
    y: topCentrePixel.y + up.y * rotationOffsetPx,
  };
  const clampedPreferred = clampPixelPointIntoBox(preferred, boxSize, edgeInsetPx);

  if (
    Math.abs(clampedPreferred.x - preferred.x) <= flipTolerancePx &&
    Math.abs(clampedPreferred.y - preferred.y) <= flipTolerancePx
  ) {
    return clampedPreferred;
  }

  return clampPixelPointIntoBox(
    {
      x: bottomCentrePixel.x - up.x * rotationOffsetPx,
      y: bottomCentrePixel.y - up.y * rotationOffsetPx,
    },
    boxSize,
    edgeInsetPx,
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
