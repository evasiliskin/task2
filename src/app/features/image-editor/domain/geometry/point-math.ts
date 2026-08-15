import { NormalizedPoint } from '../normalized-point.model';

export function addPoints(a: NormalizedPoint, b: NormalizedPoint): NormalizedPoint {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function subtractPoints(a: NormalizedPoint, b: NormalizedPoint): NormalizedPoint {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scalePoint(point: NormalizedPoint, scale: number): NormalizedPoint {
  return { x: point.x * scale, y: point.y * scale };
}

export function rotatePointAspectCorrected(
  point: NormalizedPoint,
  radians: number,
  aspectRatio: number,
): NormalizedPoint {
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return {
    x: point.x * cos - (point.y * sin) / aspectRatio,
    y: point.x * aspectRatio * sin + point.y * cos,
  };
}
