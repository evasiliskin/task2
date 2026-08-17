import { NormalizedPoint } from '../normalized-point.model';
import { CanvasBoxSize, PixelPoint } from './coordinate-mapping.model';

export function toNormalizedPoint(pixelPoint: PixelPoint, boxSize: CanvasBoxSize): NormalizedPoint {
  if (boxSize.width <= 0 || boxSize.height <= 0) {
    throw new Error('toNormalizedPoint requires a positive CanvasBoxSize width and height');
  }

  return { x: pixelPoint.x / boxSize.width, y: pixelPoint.y / boxSize.height };
}
