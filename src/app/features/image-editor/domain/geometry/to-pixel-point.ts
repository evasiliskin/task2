import { NormalizedPoint } from '../normalized-point.model';
import { CanvasBoxSize, PixelPoint } from './coordinate-mapping.model';

export function toPixelPoint(normalizedPoint: NormalizedPoint, boxSize: CanvasBoxSize): PixelPoint {
  if (boxSize.width <= 0 || boxSize.height <= 0) {
    throw new Error('toPixelPoint requires a positive CanvasBoxSize width and height');
  }

  return { x: normalizedPoint.x * boxSize.width, y: normalizedPoint.y * boxSize.height };
}
