import { NormalizedPoint } from '../normalized-point.model';

export const MIN_POLYGON_POSITION = 0;
export const MAX_POLYGON_POSITION = 1;

function clamp(value: number): number {
  return Math.min(MAX_POLYGON_POSITION, Math.max(MIN_POLYGON_POSITION, value));
}

export function clampPolygonPosition(position: NormalizedPoint): NormalizedPoint {
  return { x: clamp(position.x), y: clamp(position.y) };
}
