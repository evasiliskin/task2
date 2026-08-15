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

export interface AspectRotation {
  readonly cos: number;
  readonly sin: number;
  readonly aspectRatio: number;
}

/**
 * Precomputes a rotation so a batch of points can share one `cos`/`sin` pair.
 *
 * Normalized coordinates scale x and y independently, so a plain rotation matrix would shear
 * the polygon on any non-square image. Converting to pixels, rotating, and converting back
 * yields the aspect-corrected form applied by `applyAspectRotation`.
 */
export function createAspectRotation(radians: number, aspectRatio: number): AspectRotation {
  return { cos: Math.cos(radians), sin: Math.sin(radians), aspectRatio };
}

export function applyAspectRotation(
  point: NormalizedPoint,
  rotation: AspectRotation,
): NormalizedPoint {
  return {
    x: point.x * rotation.cos - (point.y * rotation.sin) / rotation.aspectRatio,
    y: point.x * rotation.aspectRatio * rotation.sin + point.y * rotation.cos,
  };
}

export function rotatePointAspectCorrected(
  point: NormalizedPoint,
  radians: number,
  aspectRatio: number,
): NormalizedPoint {
  return applyAspectRotation(point, createAspectRotation(radians, aspectRatio));
}
