import { CanvasBoxSize, PixelPoint } from './coordinate-mapping.model';

function clampAxis(value: number, size: number, insetPx: number): number {
  const lower = Math.min(insetPx, size / 2);
  const upper = Math.max(lower, size - insetPx);
  return Math.min(upper, Math.max(lower, value));
}

export function clampPixelPointIntoBox(
  point: PixelPoint,
  boxSize: CanvasBoxSize,
  insetPx: number,
): PixelPoint {
  return {
    x: clampAxis(point.x, boxSize.width, insetPx),
    y: clampAxis(point.y, boxSize.height, insetPx),
  };
}
