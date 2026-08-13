import { NormalizedPoint } from '../normalized-point.model';

export function addPoints(a: NormalizedPoint, b: NormalizedPoint): NormalizedPoint {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function subtractPoints(a: NormalizedPoint, b: NormalizedPoint): NormalizedPoint {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function rotatePoint(point: NormalizedPoint, radians: number): NormalizedPoint {
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
  };
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
